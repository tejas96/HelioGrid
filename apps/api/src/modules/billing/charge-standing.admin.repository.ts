import {
  billingCheckout,
  type DbTransaction,
  subscription,
  subscriptionPayment,
  tenant,
} from '@heliogrid/db';
import {
  type BillingCycle,
  type ChargeStanding,
  type CollectionKind,
  LIVE_BILLING_STATES,
  type Tier,
} from '@heliogrid/domain';
import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm';

/** A subscription as a charge reads it, locked for the rest of its transaction. */
export interface LockedSubscription extends ChargeStanding {
  readonly id: string;
  readonly tenantId: string;
  readonly currencyCode: string;
  /** What the row pays for: `null` until a charge converts it. */
  readonly tier: Tier | null;
  readonly cycle: BillingCycle | null;
  readonly planPriceId: string | null;
  /** How its plan is collected; `null` on a trial that has not paid. */
  readonly collection: CollectionKind | null;
  /** When its mandate was told to end at its cycle because the plan changed (`M12-57`). */
  readonly mandateEndingAt: number | null;
  /** The mandate or payment link it is collected on: `null` until a charge converts it. */
  readonly gatewayRef: string | null;
}

/**
 * How a subscription's plan is collected (`M12-11`): its own `collection`, else — a row an older
 * api converted while the release rolled, which never wrote it — the rail of the checkout it was
 * converted on. `null` on a trial that has not paid.
 */
export const subscriptionRail = sql<CollectionKind | null>`coalesce(${subscription.collection}, (
  select ${billingCheckout.collection} from ${billingCheckout}
  where ${billingCheckout.gatewayRef} = ${subscription.gatewayRef}))`;

/**
 * Reads a subscription `FOR UPDATE` with what a charge judges it by: whether a newer live row
 * replaced it, and when it was last charged. A charge, a failure and the timers' conditional move
 * each find the row where the one before left it.
 */
export async function lockSubscription(
  tx: DbTransaction,
  subscriptionId: string,
): Promise<LockedSubscription | null> {
  const [row] = await tx
    .select({
      id: subscription.id,
      tenantId: subscription.tenantId,
      state: subscription.state,
      stateEnteredAt: subscription.stateEnteredAt,
      paidPeriodEnd: subscription.paidPeriodEnd,
      tier: subscription.tier,
      cycle: subscription.cycle,
      planPriceId: subscription.planPriceId,
      collection: subscriptionRail,
      mandateEndingAt: subscription.mandateEndingAt,
      gatewayRef: subscription.gatewayRef,
      currencyCode: tenant.currencyCode,
    })
    .from(subscription)
    .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
    .where(eq(subscription.id, subscriptionId))
    .for('update', { of: subscription });
  if (row === undefined) return null;
  const [newer] = await tx
    .select({ id: subscription.id })
    .from(subscription)
    .where(
      and(
        eq(subscription.tenantId, row.tenantId),
        ne(subscription.id, row.id),
        inArray(subscription.state, [...LIVE_BILLING_STATES]),
      ),
    )
    .limit(1);
  const [latest] = await tx
    .select({ occurredAt: subscriptionPayment.occurredAt })
    .from(subscriptionPayment)
    .where(
      and(
        eq(subscriptionPayment.tenantId, row.tenantId),
        eq(subscriptionPayment.subscriptionId, row.id),
      ),
    )
    .orderBy(desc(subscriptionPayment.occurredAt))
    .limit(1);
  return {
    id: row.id,
    tenantId: row.tenantId,
    state: row.state,
    stateEnteredAt: row.stateEnteredAt.getTime(),
    paidPeriodEnd: row.paidPeriodEnd?.getTime() ?? null,
    lastChargedAt: latest?.occurredAt.getTime() ?? null,
    replaced: newer !== undefined,
    currencyCode: row.currencyCode,
    tier: row.tier,
    cycle: row.cycle,
    planPriceId: row.planPriceId,
    collection: row.collection,
    mandateEndingAt: row.mandateEndingAt?.getTime() ?? null,
    gatewayRef: row.gatewayRef,
  };
}
