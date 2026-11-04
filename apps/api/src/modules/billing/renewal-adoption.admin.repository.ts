import { type Db, subscription, subscriptionInvoice, tenant } from '@heliogrid/db';
import type { MarketPack } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, isNotNull, ne } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { lockSubscription } from './charge-standing.admin.repository';
import { adoptRenewalPage } from './plan-move.admin.repository';

/** A row whose mandate a plan change ended, and the paid fresh page it was never moved onto. */
export interface UnadoptedPage {
  readonly subscriptionId: string;
  readonly invoiceId: string;
  readonly gatewayRef: string;
  readonly marketCode: string;
}

/**
 * The fresh pages a renewal paid that their rows never took (`M12-57`, D387): a charge an older
 * api recorded during the roll pays the invoice and the period but leaves the row on its ended
 * mandate. The renewal sweep adopts each before it raises anything, so no row is ever asked for a
 * second page beside the one it already pays on. Across companies, so on the admin pool.
 */
@Injectable()
export class RenewalAdoptionAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** Live rows still marked ending whose renewal page, raised since, was paid. */
  async unadopted(limit: number): Promise<UnadoptedPage[]> {
    const rows = await this.db
      .select({
        subscriptionId: subscription.id,
        invoiceId: subscriptionInvoice.id,
        gatewayRef: subscriptionInvoice.gatewayRef,
        marketCode: tenant.marketCode,
      })
      .from(subscription)
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .innerJoin(
        subscriptionInvoice,
        and(
          eq(subscriptionInvoice.tenantId, subscription.tenantId),
          eq(subscriptionInvoice.subscriptionId, subscription.id),
          eq(subscriptionInvoice.status, 'paid'),
          isNotNull(subscriptionInvoice.gatewayRef),
          ne(subscriptionInvoice.gatewayRef, subscription.gatewayRef),
          gte(subscriptionInvoice.issuedAt, subscription.mandateEndingAt),
        ),
      )
      .where(and(isNotNull(subscription.mandateEndingAt), eq(subscription.state, 'active')))
      .orderBy(asc(subscriptionInvoice.issuedAt), asc(subscriptionInvoice.id))
      .limit(limit);
    return rows.flatMap(({ gatewayRef, ...row }) =>
      gatewayRef === null ? [] : [{ ...row, gatewayRef }],
    );
  }

  /** Moves the row onto its paid page, under the row's lock; a row a charge adopted first is left. */
  async adopt(page: UnadoptedPage, pack: MarketPack, now: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      const held = await lockSubscription(tx, page.subscriptionId);
      if (held === null || held.gatewayRef === page.gatewayRef) return;
      await adoptRenewalPage(tx, held, { ...page, at: now }, pack);
    });
  }
}
