import {
  type Db,
  type DbTransaction,
  subscription,
  subscriptionPayment,
  subscriptionStateHistory,
  tenant,
} from '@heliogrid/db';
import {
  type BillingState,
  type ChargeFailed,
  type ChargeStanding,
  type ChargeSucceeded,
  LIVE_BILLING_STATES,
  type SuccessEffect,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** A subscription as a charge reads it, locked for the rest of its transaction. */
interface LockedSubscription extends ChargeStanding {
  readonly id: string;
  readonly tenantId: string;
  readonly currencyCode: string;
}

/** What one charge came to. */
export type SuccessRecorded =
  | { readonly kind: 'recorded' | 'duplicate' | 'dead' }
  | { readonly kind: 'unknown subscription' }
  | { readonly kind: 'another currency'; readonly companyCurrency: string };

/**
 * Charge truth's one transaction (`M12-09`). A gateway's messages cross every company, so this rides
 * the admin pool. The subscription row is read `FOR UPDATE` first: a charge, a failure and the
 * timers' conditional move each find it where the one before left it. What a charge does is
 * domain's; the caller hands it in as `decide`.
 *
 * The invoice (T-M12-012) and the dunning clear (T-M12-011) join `recordSuccess`'s transaction.
 */
@Injectable()
export class ChargeAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async recordSuccess(
    charge: ChargeSucceeded,
    recordedAt: number,
    decide: (standing: ChargeStanding) => SuccessEffect,
  ): Promise<SuccessRecorded> {
    return this.db.transaction(async (tx) => {
      const held = await lockSubscription(tx, charge.subscriptionId);
      if (held === null) return { kind: 'unknown subscription' };
      if (held.currencyCode !== charge.currencyCode) {
        return { kind: 'another currency', companyCurrency: held.currencyCode };
      }
      const [paid] = await tx
        .insert(subscriptionPayment)
        .values({
          tenantId: held.tenantId,
          subscriptionId: held.id,
          gatewayChargeRef: charge.chargeRef,
          amountMinor: charge.amount,
          currencyCode: charge.currencyCode,
          paysThrough: new Date(charge.paysThrough),
          occurredAt: new Date(charge.occurredAt),
          recordedAt: new Date(recordedAt),
        })
        .onConflictDoNothing({ target: subscriptionPayment.gatewayChargeRef })
        .returning({ id: subscriptionPayment.id });
      if (!paid) return { kind: 'duplicate' };
      const effect = decide(held);
      if (effect.outcome === 'dead') return { kind: 'dead' };
      await tx
        .update(subscription)
        .set({
          paidPeriodEnd: new Date(effect.paidPeriodEnd),
          ...(effect.moveTo === null
            ? {}
            : { state: effect.moveTo, stateEnteredAt: new Date(charge.occurredAt) }),
        })
        .where(eq(subscription.id, held.id));
      if (effect.moveTo !== null) {
        await recordState(tx, held, effect.moveTo, 'paid', charge.occurredAt);
      }
      return { kind: 'recorded' };
    });
  }

  /** `null` when the subscription does not exist; else whether the failure moved it. */
  async recordFailure(
    failure: ChargeFailed,
    decide: (standing: ChargeStanding) => BillingState | null,
  ): Promise<boolean | null> {
    return this.db.transaction(async (tx) => {
      const held = await lockSubscription(tx, failure.subscriptionId);
      if (held === null) return null;
      const to = decide(held);
      if (to === null) return false;
      await tx
        .update(subscription)
        .set({ state: to, stateEnteredAt: new Date(failure.occurredAt) })
        .where(eq(subscription.id, held.id));
      await recordState(tx, held, to, 'charge_failed', failure.occurredAt);
      return true;
    });
  }
}

async function lockSubscription(
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
  };
}

async function recordState(
  tx: DbTransaction,
  held: LockedSubscription,
  state: BillingState,
  cause: 'paid' | 'charge_failed',
  enteredAt: number,
): Promise<void> {
  await tx.insert(subscriptionStateHistory).values({
    tenantId: held.tenantId,
    subscriptionId: held.id,
    state,
    cause,
    enteredAt: new Date(enteredAt),
  });
}
