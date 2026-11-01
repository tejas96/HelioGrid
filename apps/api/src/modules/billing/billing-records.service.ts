import type {
  BillingDocuments,
  BillingDocumentsQuery,
  BillingHistory,
  BillingReminders,
  PaginationQuery,
} from '@heliogrid/contracts';
import { billingStandingOf, upcomingNotice } from '@heliogrid/domain';
import { invoiceTotals } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { MarketPackService } from '../market/market.public';
import { BillingHomeRepository } from './billing-home.repository';
import { BillingRecordsRepository, type PageWindow } from './billing-records.repository';
import { decimalOf } from './internal/billing-sale';
import { PlanPriceAdminRepository } from './plan-price.admin.repository';

const pageOf = (query: PaginationQuery): PageWindow => ({
  limit: query.limit,
  offset: (query.page - 1) * query.limit,
});

/** Every invoice and credit note, the reminders told and the plan history (`M12-46`, D3). */
@Injectable()
export class BillingRecordsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(BillingRecordsRepository) private readonly records: BillingRecordsRepository,
    @Inject(BillingHomeRepository) private readonly home: BillingHomeRepository,
    @Inject(PlanPriceAdminRepository) private readonly prices: PlanPriceAdminRepository,
    @Inject(MarketPackService) private readonly packs: MarketPackService,
  ) {}

  /**
   * One page of documents: a credit note's total is its own amount, an invoice's the sum of the
   * lines it stored; each names the plan its invoice's plan line sold.
   */
  async documents(tenantId: string, query: BillingDocumentsQuery): Promise<BillingDocuments> {
    const pack = await this.packs.currentPackOf(await this.home.marketOf(tenantId));
    const search = { q: query.q === '' ? undefined : query.q, status: query.status };
    const page = await this.records.documents(tenantId, search, pageOf(query));
    const stored = await this.records.storedInvoices(
      tenantId,
      page.items.map((row) => row.invoiceId),
    );
    const plans = await this.prices.byIds(
      [...stored.values()].flatMap((invoice) => invoice.planPriceId ?? []),
    );
    const items = page.items.map((row) => {
      const invoice = stored.get(row.invoiceId);
      const plan = plans.get(invoice?.planPriceId ?? '');
      if (invoice === undefined || plan === undefined) {
        throw new Error(`${row.document} ${row.id} bills against no plan line`);
      }
      return {
        id: row.id,
        document: row.document,
        number: row.number,
        status: row.status,
        issuedAt: row.issuedAt.toISOString(),
        tier: plan.tier,
        cycle: plan.cycle,
        total: decimalOf(pack, row.amountMinor ?? invoiceTotals(invoice.lines).total),
        hasPdf: row.hasPdf,
      };
    });
    return {
      items,
      totalCount: page.totalCount,
      currencyCode: pack.formats.currency,
      counts: page.counts,
    };
  }

  /** The notices told, newest first; the next one the newest row's ladder tells, if any. */
  async reminders(
    tenantId: string,
    query: PaginationQuery,
    now: number,
  ): Promise<BillingReminders> {
    const page = await this.records.reminders(tenantId, pageOf(query));
    const row = await this.home.latestRow(tenantId);
    let next: BillingReminders['next'] = null;
    if (row !== null) {
      const pack = await this.packs.currentPackOf(row.marketCode);
      // The newest row is never replaced: a newer one would be the newest.
      const settled = { ...row, ...billingStandingOf(row, pack.paymentRails.ladder, now) };
      const upcoming = upcomingNotice(
        { ...settled, trialEndsAt: row.trialEndsAt, replaced: false },
        now,
      );
      next =
        upcoming === null
          ? null
          : { notice: upcoming.notice, dueAt: new Date(upcoming.dueAt).toISOString() };
    }
    return {
      items: page.items.map((item) => ({
        id: item.id,
        notice: item.notice,
        firedAt: item.firedAt.toISOString(),
        clearedAt: item.clearedAt?.toISOString() ?? null,
        paidAt: item.paidAt?.toISOString() ?? null,
      })),
      totalCount: page.totalCount,
      next,
    };
  }

  async history(tenantId: string, query: PaginationQuery): Promise<BillingHistory> {
    const page = await this.records.history(tenantId, pageOf(query));
    return {
      items: page.items.map((item) => ({ ...item, enteredAt: item.enteredAt.toISOString() })),
      totalCount: page.totalCount,
    };
  }
}
