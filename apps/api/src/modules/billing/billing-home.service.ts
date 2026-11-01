import type {
  BillingDocuments,
  BillingDocumentsQuery,
  BillingHistory,
  BillingHome,
  BillingReminders,
  BillingStanding,
  PaginationQuery,
} from '@heliogrid/contracts';
import {
  type BillingStandingFacts,
  billingStandingOf,
  type MarketPack,
  type MinorUnits,
  publicPricing,
  refundWindowClosesAt,
  tierBand,
  trialCapacity,
} from '@heliogrid/domain';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MarketPackService } from '../market/market.public';
import { BillingHomeRepository, type HomeRow } from './billing-home.repository';
import { BillingHomeUsageService } from './billing-home.usage.service';
import { BillingRecordsRepository } from './billing-records.repository';
import { BillingRecordsService } from './billing-records.service';
import { decimalOf, type SaleWire, saleOfInvoice, saleOfList } from './internal/billing-sale';
import { PlanPriceAdminRepository } from './plan-price.admin.repository';
import { RefundAdminRepository } from './refund.admin.repository';

const iso = (moment: number | null) => (moment === null ? null : new Date(moment).toISOString());

/**
 * The Owner's billing home (`SCR-M12-02`): where the subscription stands, for everyone (`M12-56`),
 * and the money beside it for the Owner. Every amount is worked out here (`F4-04`, D1a).
 */
@Injectable()
export class BillingHomeService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(BillingHomeRepository) private readonly rows: BillingHomeRepository,
    @Inject(BillingRecordsRepository) private readonly records: BillingRecordsRepository,
    @Inject(BillingRecordsService) private readonly lists: BillingRecordsService,
    @Inject(BillingHomeUsageService) private readonly meters: BillingHomeUsageService,
    @Inject(PlanPriceAdminRepository) private readonly prices: PlanPriceAdminRepository,
    @Inject(RefundAdminRepository) private readonly refunds: RefundAdminRepository,
    @Inject(MarketPackService) private readonly packs: MarketPackService,
  ) {}

  async standing(tenantId: string, now: number): Promise<BillingStanding> {
    const { facts } = await this.standingOf(tenantId, now);
    return standingWire(facts);
  }

  async home(tenantId: string, now: number): Promise<BillingHome> {
    const { row, facts, pack, publishedAt } = await this.standingOf(tenantId, now);
    const { state } = facts;
    const includes = includesOf(pack, facts);
    const own =
      row.planPriceId === null
        ? null
        : (await this.prices.byIds([row.planPriceId])).get(row.planPriceId);
    const manageUrl =
      facts.collection === 'mandate' && row.gatewayRef !== null
        ? await this.rows.mandatePage(tenantId, row.gatewayRef)
        : null;
    return {
      standing: standingWire(facts),
      currencyCode: pack.formats.currency,
      taxScheme: pack.tax.platformRegistration === null ? null : pack.tax.scheme,
      priceListPublishedAt: publishedAt,
      plan: {
        listPrice: own === undefined || own === null ? null : decimalOf(pack, own.listMinor),
        nextBill: await this.nextBillOf(pack, facts, own ?? null),
      },
      includes,
      usage: await this.meters.nearestLimits(tenantId, row, includes, now),
      method: methodOf(pack, facts, manageUrl),
      due:
        state === 'past_due' && own !== undefined && own !== null
          ? await this.dueOf(tenantId, row, facts, pack, saleOfList(pack, own.listMinor), manageUrl)
          : null,
      renewal: await this.renewalOf(tenantId, row, pack),
      refund: await this.refundOf(tenantId, row, pack, now),
      reactivation:
        (state === 'halted' || state === 'cancelled') && facts.tier !== null && facts.cycle !== null
          ? await this.todaysSale(pack, facts, (sale) => ({
              tier: facts.tier ?? 'starter',
              cycle: facts.cycle ?? 'monthly',
              sale,
              startsAt:
                state === 'cancelled' && facts.paidPeriodEnd !== null && now < facts.paidPeriodEnd
                  ? iso(facts.paidPeriodEnd)
                  : null,
            }))
          : null,
      invoices: await this.latestInvoices(tenantId),
      cancellable: state === 'active',
      salesContact: pack.priceBook.salesContact ?? null,
    };
  }

  documents(tenantId: string, query: BillingDocumentsQuery): Promise<BillingDocuments> {
    return this.lists.documents(tenantId, query);
  }

  reminders(tenantId: string, query: PaginationQuery, now: number): Promise<BillingReminders> {
    return this.lists.reminders(tenantId, query, now);
  }

  history(tenantId: string, query: PaginationQuery): Promise<BillingHistory> {
    return this.lists.history(tenantId, query);
  }

  private async standingOf(tenantId: string, now: number) {
    const row = await this.rows.latestRow(tenantId);
    if (row === null) throw new NotFoundException();
    const published = await this.packs.currentPublished(row.marketCode);
    if (published === null) throw new Error(`no pack is published for market ${row.marketCode}`);
    const { pack, publishedAt } = published;
    return { row, pack, publishedAt, facts: billingStandingOf(row, pack.paymentRails.ladder, now) };
  }

  /** Today's price for the row's tier and cycle, sold (`M12-57`); `null` when the book sells none. */
  /**
   * The next bill on an `active` row. A mandate debits the amount it was approved for, its own
   * plan price (D392); a payment link is raised at today's book (`M12-57`).
   */
  private async nextBillOf(
    pack: MarketPack,
    facts: BillingStandingFacts,
    own: { readonly listMinor: MinorUnits } | null,
  ): Promise<BillingHome['plan']['nextBill']> {
    const at = iso(facts.paidPeriodEnd);
    if (facts.state !== 'active' || at === null) return null;
    if (facts.collection === 'mandate' && own !== null) {
      return { at, sale: saleOfList(pack, own.listMinor) };
    }
    return this.todaysSale(pack, facts, (sale) => ({ at, sale }));
  }

  private async todaysSale<T>(
    pack: MarketPack,
    facts: BillingStandingFacts,
    shape: (sale: SaleWire) => T,
  ): Promise<T | null> {
    if (facts.tier === null || facts.cycle === null) return null;
    const today = await this.prices.current({
      marketCode: pack.market,
      tier: facts.tier,
      cycle: facts.cycle,
      currencyCode: pack.formats.currency,
    });
    return today === null ? null : shape(saleOfList(pack, today.listMinor));
  }

  /**
   * A failed charge still owed (D5): a link company owes its failed invoice and pays on its link;
   * a mandate's failed debit has no invoice, so it owes the plan price and pays on the mandate page.
   */
  private async dueOf(
    tenantId: string,
    row: HomeRow,
    facts: BillingStandingFacts,
    pack: MarketPack,
    planSale: SaleWire,
    manageUrl: string | null,
  ): Promise<BillingHome['due']> {
    const failedAt = iso(facts.stateEnteredAt) ?? '';
    if (facts.collection === 'invoice') {
      const failed = await this.rows.linkInvoice(tenantId, row.id, 'failed');
      if (failed !== null) {
        const stored = (await this.records.storedInvoices(tenantId, [failed.id])).get(failed.id);
        return {
          sale: stored === undefined ? planSale : saleOfInvoice(pack, stored.lines),
          failedAt,
          invoiceNumber: failed.number,
          payUrl: failed.hostedUrl,
        };
      }
    }
    return { sale: planSale, failedAt, invoiceNumber: null, payUrl: manageUrl };
  }

  private async renewalOf(
    tenantId: string,
    row: HomeRow,
    pack: MarketPack,
  ): Promise<BillingHome['renewal']> {
    const issued = await this.rows.linkInvoice(tenantId, row.id, 'issued');
    if (issued === null || issued.hostedUrl === null || issued.dueAt === null) return null;
    const stored = (await this.records.storedInvoices(tenantId, [issued.id])).get(issued.id);
    if (stored === undefined) return null;
    return {
      invoiceId: issued.id,
      number: issued.number,
      sale: saleOfInvoice(pack, stored.lines),
      dueAt: iso(issued.dueAt) ?? '',
      payUrl: issued.hostedUrl,
    };
  }

  /** The first paid cycle's window (`M12-47`): its row still `active`, through its seventh day. */
  private async refundOf(
    tenantId: string,
    row: HomeRow,
    pack: MarketPack,
    now: number,
  ): Promise<BillingHome['refund']> {
    const first = await this.refunds.firstPaymentOf(tenantId);
    if (first === null || first.subscriptionId !== row.id || first.state !== 'active') return null;
    const closesAt = refundWindowClosesAt(first.paidAt, first.timeZone);
    return now < closesAt
      ? { closesAt: iso(closesAt) ?? '', amount: decimalOf(pack, first.amount) }
      : null;
  }

  private async latestInvoices(tenantId: string): Promise<BillingHome['invoices']> {
    const latest = await this.lists.documents(tenantId, { limit: 3, page: 1 });
    return { latest: latest.items, totalCount: latest.totalCount };
  }
}

function standingWire(facts: BillingStandingFacts): BillingStanding {
  return {
    state: facts.state,
    phase: facts.phase,
    tier: facts.tier,
    cycle: facts.cycle,
    collection: facts.collection,
    stateEnteredAt: iso(facts.stateEnteredAt) ?? '',
    trialEndsAt: iso(facts.trialEndsAt),
    pausesAt: iso(facts.pausesAt),
    graceEndsAt: iso(facts.graceEndsAt),
    paidPeriodEnd: iso(facts.paidPeriodEnd),
  };
}

/**
 * A paid row's method — a mandate or a payment link (frame 24: `Payment link · yearly`) — is live
 * while it collects and ended once the row is dead (decision 6a); a trial has none.
 */
function methodStanding(facts: BillingStandingFacts): BillingHome['method']['standing'] {
  if (facts.collection === null) return 'none';
  return facts.state === 'active' || facts.state === 'past_due' ? 'live' : 'ended';
}

/** The method row: its standing, the rail's name, and the mandate's own page while it collects. */
function methodOf(
  pack: MarketPack,
  facts: BillingStandingFacts,
  manageUrl: string | null,
): BillingHome['method'] {
  const standing = methodStanding(facts);
  return {
    standing,
    label: methodLabel(pack, facts),
    // Only a mandate has a page of its own (`manageUrl` is read for none else).
    manageUrl: standing === 'live' ? manageUrl : null,
  };
}

/** The rail a mandate rides, as the pack names it; `null` on a link or a pack without labels. */
function methodLabel(
  pack: MarketPack,
  facts: BillingStandingFacts,
): BillingHome['method']['label'] {
  if (facts.tier === null || facts.cycle === null) return null;
  const route = pack.paymentRails.ladder[tierBand(facts.tier)][facts.cycle];
  if (route.collection !== 'mandate') return null;
  return pack.paymentRails.mandateTypes.find((type) => type.type === route.primary)?.label ?? null;
}

/**
 * The row's plan as the pricing page prints it, or the trial's caps on a trial, an expired trial
 * or a row with no plan (`M12-55`, `M12-52`).
 */
export function includesOf(pack: MarketPack, facts: BillingStandingFacts): BillingHome['includes'] {
  const pricing = publicPricing(pack);
  const plan =
    facts.state === 'trialing' || facts.state === 'expired'
      ? undefined
      : pricing?.plans.find((candidate) => candidate.tier === facts.tier);
  if (plan !== undefined) {
    return {
      designCeilingKw: plan.designCeilingKw,
      proposalsPerMonth: plan.proposalsPerMonth,
      activeProjects: plan.activeProjects,
      voiceMinutesIncluded: plan.voiceMinutesIncluded,
      voiceMinuteRate:
        plan.voiceMinuteRate.kind === 'published'
          ? decimalOf(pack, plan.voiceMinuteRate.rate)
          : null,
      storageGb: plan.storageGb,
    };
  }
  const trial = trialCapacity(pack.priceBook);
  return {
    designCeilingKw: trial.designCeilingKw,
    proposalsPerMonth: trial.creationsPerCycle.proposals,
    activeProjects: trial.creationsPerCycle.active_projects,
    voiceMinutesIncluded: trial.meterBundles.voice_minutes,
    // A trial pays nothing, so no rate stands beside its cap (`M12-52`).
    voiceMinuteRate: null,
    storageGb: trial.storageGb,
  };
}
