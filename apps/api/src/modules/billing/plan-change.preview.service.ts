import { createHash } from 'node:crypto';
import type { PlanChangePreview, PlanPick } from '@heliogrid/contracts';
import {
  activeProjectsBlock,
  type BillingCycle,
  type CollectionKind,
  listedPrice,
  type MarketPack,
  type MinorUnits,
  MS_PER_DAY,
  minorUnits,
  nextLocalTime,
  type PlanChangeKind,
  planChangeKindOf,
  storageRefuses,
  type Tier,
  tierRow,
} from '@heliogrid/domain';
import { dayRate, partCycleCharge } from '@heliogrid/domain/server';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ContractException } from '../../common/errors/contract-exception';
import { MarketPackService } from '../market/market.public';
import { BillingHomeRepository } from './billing-home.repository';
import { decimalOf, saleOfList } from './internal/billing-sale';
import { cycleEnd } from './internal/cycle-end';
import { planIncludesOf } from './internal/plan-includes';
import type { PlanStanding } from './plan-change.admin.repository';
import { collectionOf } from './plan-move.admin.repository';
import { PlanPriceAdminRepository, type PlanPriceRow } from './plan-price.admin.repository';
import { UsageService } from './usage.service';

/** One pick worked out: the review the screen draws, and what the act needs beside it. */
export interface WorkedPick {
  readonly preview: PlanChangePreview;
  readonly kind: PlanChangeKind;
  readonly pack: MarketPack;
  readonly target: PlanPriceRow;
  readonly toCollection: CollectionKind;
  /** The part-cycle charge, ex-tax (`M12-48`): an upgrade's, or a cycle switch's ₹0; else `null`. */
  readonly charge: MinorUnits | null;
}

const iso = (moment: number) => new Date(moment).toISOString();

/** Hex characters a digest keeps: 128 bits, well inside the request's 128-character bound. */
const DIGEST_LENGTH = 32;

/**
 * One review of one pick (`SCR-M12-03`), every amount worked out here (`F4-04`): the kind from
 * the tiers' order (`M12-48`, `M12-49`, `M12-12`), an upgrade's part-cycle charge, and what a
 * downgrade blocks — real usage only: storage and live projects (`PLAN_CHANGE_BLOCKS`). The digest names the
 * usage and the price the review read, so a confirm on a picture that moved is refused (`M12-49`).
 */
@Injectable()
export class PlanChangePreviewService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(PlanPriceAdminRepository) private readonly prices: PlanPriceAdminRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(UsageService) private readonly usage: UsageService,
    @Inject(BillingHomeRepository) private readonly periods: BillingHomeRepository,
  ) {}

  /**
   * The pick reviewed against today's book, or against `target` — the price a scheduled change
   * was confirmed on, so the timers compare the same digest. Throws `TIER_NOT_SOLD` for a pick
   * the book does not sell on that cycle, and `PLAN_CHANGE_NOT_POSSIBLE` for the plan already held.
   */
  async workOut(
    tenantId: string,
    standing: PlanStanding,
    pick: PlanPick,
    now: number,
    target?: PlanPriceRow,
  ): Promise<WorkedPick> {
    const published = await this.markets.currentPublished(standing.marketCode);
    if (published === null) throw new Error(`no pack is published for ${standing.marketCode}`);
    const { pack, publishedAt } = published;
    if (listedPrice(pack.priceBook, pick.tier, pick.cycle) === null) throw notSold();
    const to = target ?? (await this.currentPrice(standing, pick));
    const kind = kindOf(pack, standing, pick);
    const held = kind === 'conversion' ? null : await this.heldPrice(standing);
    const charge =
      (kind === 'upgrade' || kind === 'cycle_switch') && held !== null
        ? await this.partCycle(tenantId, standing, pack, { held, to, cycle: pick.cycle, kind }, now)
        : null;
    const blocks = kind === 'downgrade' ? await this.blocksOf(tenantId, pack, pick.tier) : null;
    const startsAt = startsAtOf(standing, kind, now);
    const from = heldPickOf(standing);
    const preview: PlanChangePreview = {
      kind,
      from,
      to: { tier: pick.tier, cycle: pick.cycle },
      currencyCode: pack.formats.currency,
      taxScheme: pack.tax.platformRegistration === null ? null : pack.tax.scheme,
      priceListPublishedAt: publishedAt,
      includes: {
        from: planIncludesOf(pack, from?.tier ?? null),
        to: planIncludesOf(pack, pick.tier),
      },
      today: todayOf(pack, kind, to, charge),
      startsAt: iso(startsAt),
      nextBillAt: iso(kind === 'conversion' ? cycleEnd(startsAt, pick.cycle) : startsAt),
      afterwards: saleOfList(pack, to.listMinor),
      blocks,
      digest: digestOf({
        toPriceId: to.id,
        heldPriceId: standing.planPriceId,
        paidPeriodEnd: standing.paidPeriodEnd,
        charge: charge?.amount ?? null,
        blocks,
      }),
    };
    return {
      preview,
      kind,
      pack,
      target: to,
      toCollection: collectionOf(pack, pick.tier, pick.cycle),
      charge: charge?.amount ?? null,
    };
  }

  private async currentPrice(standing: PlanStanding, pick: PlanPick): Promise<PlanPriceRow> {
    const price = await this.prices.current({
      marketCode: standing.marketCode,
      tier: pick.tier,
      cycle: pick.cycle,
      currencyCode: standing.currencyCode,
    });
    // The book sells it, so the publish command wrote its plan price: a missing row is a broken
    // deployment, said loudly and never guessed around.
    if (price === null) {
      throw new Error(`no plan price for ${pick.tier} ${pick.cycle} in ${standing.marketCode}`);
    }
    return price;
  }

  private async heldPrice(standing: PlanStanding): Promise<PlanPriceRow | null> {
    if (standing.planPriceId === null) return null;
    return (await this.prices.byIds([standing.planPriceId])).get(standing.planPriceId) ?? null;
  }

  /**
   * `M12-48` — the days left of the paid period, counted from the start of today on the
   * company's clock, priced at the new plan's daily rate less the old one's. A cycle's days are
   * its own: this period's from its start to its end, another cycle's from `cycleEnd`.
   */
  private async partCycle(
    tenantId: string,
    standing: PlanStanding,
    pack: MarketPack,
    plans: {
      readonly held: PlanPriceRow;
      readonly to: PlanPriceRow;
      readonly cycle: BillingCycle;
      readonly kind: 'upgrade' | 'cycle_switch';
    },
    now: number,
  ) {
    const end = standing.paidPeriodEnd ?? now;
    const start = (await this.periods.paidPeriodStart(tenantId, standing.subscriptionId)) ?? now;
    const daysInCycle = Math.max(1, wholeDays(end - start));
    // The same cycle is this period's own length; another is counted from this period's start.
    const toCycleDays =
      plans.cycle === standing.cycle
        ? daysInCycle
        : Math.max(1, wholeDays(cycleEnd(start, plans.cycle) - start));
    const todayStarted = nextLocalTime(now, 0, pack.formats.timeZone) - MS_PER_DAY;
    const daysLeft = Math.min(
      daysInCycle,
      Math.max(0, Math.floor((end - todayStarted) / MS_PER_DAY)),
    );
    const from = { price: plans.held.listMinor, days: daysInCycle };
    const to = { price: plans.to.listMinor, days: toCycleDays };
    const sameCycle = plans.cycle === standing.cycle;
    return {
      // A cycle switch takes the money path at the period's end: nothing is owed today (`M12-12`).
      amount:
        plans.kind === 'cycle_switch' ? minorUnits(0) : partCycleCharge({ daysLeft, from, to }),
      working: {
        daysLeft,
        daysInCycle,
        fromPrice: decimalOf(pack, from.price),
        toPrice: decimalOf(pack, to.price),
        toCycleDays,
        // Two prices of one cycle differ by a plain subtraction; across cycles only the day rates do.
        difference: sameCycle ? decimalOf(pack, minorUnits(to.price - from.price)) : null,
        fromDayRate: decimalOf(pack, dayRate(from)),
        toDayRate: decimalOf(pack, dayRate(to)),
      },
    };
  }

  /**
   * What the lower plan blocks, from real usage (`M12-49`): storage, when the latest nightly gauge
   * is past what the lower plan's storage gate lets through (`storageRefuses`); live projects, when
   * more are live than the lower plan holds (`M08-07`). Empty when nothing is over.
   */
  private async blocksOf(
    tenantId: string,
    pack: MarketPack,
    tier: Tier,
  ): Promise<NonNullable<PlanChangePreview['blocks']>> {
    const capacity = tierRow(pack.priceBook, tier)?.capacity;
    const storageGb = capacity?.storageGb ?? 'unlimited';
    const gauge = await this.usage.latestStorageGauge(tenantId);
    const projects = activeProjectsBlock(
      await this.usage.activeProjects(tenantId),
      capacity?.creationsPerCycle.active_projects ?? 'unlimited',
    );
    return [
      ...(gauge !== null && storageRefuses(gauge.gaugeBytes, storageGb)
        ? [{ block: 'storage' as const, used: gauge.gaugeBytes, limit: storageGb }]
        : []),
      ...(projects === null ? [] : [{ block: 'active_projects' as const, ...projects }]),
    ];
  }
}

/** The plan the row holds, as the review names it: `null` on a trial, which holds none (`M12-52`). */
function heldPickOf(standing: PlanStanding): PlanPick | null {
  if (standing.state === 'trialing' || standing.state === 'expired') return null;
  if (standing.tier === null || standing.cycle === null) return null;
  return { tier: standing.tier, cycle: standing.cycle };
}

/** A trial or a dead row converts; a live paid row changes as the tiers' order says. */
function kindOf(pack: MarketPack, standing: PlanStanding, pick: PlanPick): PlanChangeKind {
  if (standing.state !== 'active' && standing.state !== 'past_due') return 'conversion';
  const heldRow = standing.tier === null ? null : tierRow(pack.priceBook, standing.tier);
  if (
    standing.tier === null ||
    standing.cycle === null ||
    heldRow === null ||
    tierRow(pack.priceBook, pick.tier) === null
  ) {
    throw notSold();
  }
  const kind = planChangeKindOf(
    { tier: standing.tier, cycle: standing.cycle },
    { tier: pick.tier, cycle: pick.cycle },
  );
  if (kind === null) {
    throw new ContractException(
      'PLAN_CHANGE_NOT_POSSIBLE',
      'That is the plan this company holds.',
      HttpStatus.CONFLICT,
    );
  }
  return kind;
}

/**
 * When the pick takes the money path: a change at the paid period's end; a conversion now — or,
 * for a cancelled row still running, at its period's end, so no day is paid twice (`M12-08`).
 */
function startsAtOf(standing: PlanStanding, kind: PlanChangeKind, now: number): number {
  const end = standing.paidPeriodEnd;
  if (kind !== 'conversion') return end ?? now;
  return standing.state === 'cancelled' && end !== null && end > now ? end : now;
}

function todayOf(
  pack: MarketPack,
  kind: PlanChangeKind,
  to: PlanPriceRow,
  charge: {
    readonly amount: MinorUnits;
    readonly working: NonNullable<NonNullable<PlanChangePreview['today']>['partCycle']>;
  } | null,
): PlanChangePreview['today'] {
  if (kind === 'conversion') return { sale: saleOfList(pack, to.listMinor), partCycle: null };
  // A downgrade pays nothing today and shows no working; an upgrade or a cycle switch shows its
  // part-cycle working, at ₹0 when the new day rate is no higher (`M12-48`).
  if (charge === null) return null;
  return { sale: saleOfList(pack, charge.amount), partCycle: charge.working };
}

/**
 * Everything the review was read on, hashed: the plan held and its paid period's end, the plan
 * picked, today's charge and every block's figures. A renewal, a plan move, a day rolled over or
 * usage that moved names another digest, so a confirm on the old review is refused (`M12-49`).
 */
function digestOf(picture: {
  readonly toPriceId: string;
  readonly heldPriceId: string | null;
  readonly paidPeriodEnd: number | null;
  readonly charge: MinorUnits | null;
  readonly blocks: PlanChangePreview['blocks'];
}): string {
  const read = JSON.stringify({
    ...picture,
    blocks: (picture.blocks ?? []).map(({ block, used, limit }) => [block, used, limit]),
  });
  return createHash('sha256').update(read).digest('hex').slice(0, DIGEST_LENGTH);
}

function wholeDays(span: number): number {
  return Math.round(span / MS_PER_DAY);
}

function notSold() {
  return new ContractException(
    'TIER_NOT_SOLD',
    'That plan is not sold on that cycle here. Enterprise is arranged with our team.',
    HttpStatus.UNPROCESSABLE_ENTITY,
  );
}
