import {
  billingCheckout,
  subscription,
  subscriptionInvoice,
  subscriptionPayment,
  type TenantPool,
  tenant,
} from '@heliogrid/db';
import type { StandingRow } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/** The company's newest subscription row, with what the home reads beside its clock. */
export interface HomeRow extends StandingRow {
  readonly id: string;
  readonly planPriceId: string | null;
  readonly gatewayRef: string | null;
  readonly createdAt: number;
  readonly marketCode: string;
}

/** An open charge's invoice: its number, the page that pays it, and when an issued one falls due. */
export interface OpenInvoice {
  readonly id: string;
  readonly number: string;
  readonly hostedUrl: string | null;
  readonly dueAt: number | null;
}

/**
 * What the billing home reads of one company (`SCR-M12-02`), on the tenant pool: the policy and the
 * predicate both. The newest row is the company's standing — a reactivation starts a new one
 * (`M12-08`) — by `subscription_tenant_created_idx`.
 */
@Injectable()
export class BillingHomeRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async latestRow(tenantId: string): Promise<HomeRow | null> {
    const [row] = await this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({
          id: subscription.id,
          state: subscription.state,
          stateEnteredAt: subscription.stateEnteredAt,
          trialEndsAt: subscription.trialEndsAt,
          paidPeriodEnd: subscription.paidPeriodEnd,
          createdAt: subscription.createdAt,
          tier: subscription.tier,
          cycle: subscription.cycle,
          planPriceId: subscription.planPriceId,
          gatewayRef: subscription.gatewayRef,
          marketCode: tenant.marketCode,
        })
        .from(subscription)
        .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
        .where(eq(subscription.tenantId, tenantId))
        .orderBy(desc(subscription.createdAt), desc(subscription.id))
        .limit(1),
    );
    if (row === undefined) return null;
    return {
      ...row,
      stateEnteredAt: row.stateEnteredAt.getTime(),
      trialEndsAt: row.trialEndsAt?.getTime() ?? null,
      paidPeriodEnd: row.paidPeriodEnd?.getTime() ?? null,
      createdAt: row.createdAt.getTime(),
    };
  }

  /** The company's market: its pack prices and formats every figure. */
  async marketOf(tenantId: string): Promise<string> {
    const [row] = await this.db.withTenantTransaction(tenantId, (tx) =>
      tx.select({ marketCode: tenant.marketCode }).from(tenant).where(eq(tenant.id, tenantId)),
    );
    if (row === undefined) throw new Error(`no company ${tenantId}`);
    return row.marketCode;
  }

  /**
   * When the row's latest paid period began: the end of the period paid before it, else the
   * moment its first charge landed — as the overage reckoning reads a period. `null` before any.
   */
  async paidPeriodStart(tenantId: string, subscriptionId: string): Promise<number | null> {
    const earlier = sql<Date | null>`(
      select max(earlier.pays_through) from subscription_payment earlier
      where earlier.tenant_id = ${subscriptionPayment.tenantId}
        and earlier.subscription_id = ${subscriptionPayment.subscriptionId}
        and earlier.pays_through < ${subscriptionPayment.paysThrough})`.mapWith(
      subscriptionPayment.paysThrough,
    );
    const [latest] = await this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({ occurredAt: subscriptionPayment.occurredAt, earlier })
        .from(subscriptionPayment)
        .where(
          and(
            eq(subscriptionPayment.tenantId, tenantId),
            eq(subscriptionPayment.subscriptionId, subscriptionId),
          ),
        )
        .orderBy(desc(subscriptionPayment.occurredAt), desc(subscriptionPayment.id))
        .limit(1),
    );
    if (latest === undefined) return null;
    return (latest.earlier ?? latest.occurredAt).getTime();
  }

  /** The gateway's own page for a mandate: the checkout that opened it (`M12-10`). */
  async mandatePage(tenantId: string, gatewayRef: string): Promise<string | null> {
    const [page] = await this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({ hostedUrl: billingCheckout.hostedUrl })
        .from(billingCheckout)
        .where(
          and(eq(billingCheckout.tenantId, tenantId), eq(billingCheckout.gatewayRef, gatewayRef)),
        )
        .limit(1),
    );
    return page?.hostedUrl ?? null;
  }

  /** The row's newest invoice in this status that a payment link collects (`T-M12-012c`). */
  async linkInvoice(
    tenantId: string,
    subscriptionId: string,
    status: 'issued' | 'failed',
  ): Promise<OpenInvoice | null> {
    const [invoice] = await this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({
          id: subscriptionInvoice.id,
          number: subscriptionInvoice.number,
          hostedUrl: subscriptionInvoice.hostedUrl,
          dueAt: subscriptionInvoice.dueAt,
        })
        .from(subscriptionInvoice)
        .where(
          and(
            eq(subscriptionInvoice.tenantId, tenantId),
            eq(subscriptionInvoice.subscriptionId, subscriptionId),
            eq(subscriptionInvoice.status, status),
            isNotNull(subscriptionInvoice.hostedUrl),
          ),
        )
        .orderBy(desc(subscriptionInvoice.issuedAt), desc(subscriptionInvoice.id))
        .limit(1),
    );
    return invoice === undefined ? null : { ...invoice, dueAt: invoice.dueAt?.getTime() ?? null };
  }
}
