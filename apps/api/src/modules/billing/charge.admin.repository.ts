import {
  billingCheckout,
  type Db,
  type DbTransaction,
  planPrice,
  subscription,
  subscriptionPayment,
  subscriptionStateHistory,
  tenant,
} from '@heliogrid/db';
import {
  type BillingCycle,
  type BillingState,
  type ChargeFailed,
  type ChargeStanding,
  type ChargeSucceeded,
  type CollectionKind,
  LIVE_BILLING_STATES,
  type SuccessEffect,
  type Tier,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { type LimitsFor, recomputeEntitlements } from './entitlement.admin.repository';

/** A subscription as a charge reads it, locked for the rest of its transaction. */
interface LockedSubscription extends ChargeStanding {
  readonly id: string;
  readonly tenantId: string;
  readonly currencyCode: string;
  /** What the row pays for: `null` until a charge converts it. */
  readonly tier: Tier | null;
}

/** The plan a trial chose at checkout, which the charge that pays for it makes the row's own. */
export interface Conversion {
  readonly checkoutId: string;
  readonly planPriceId: string;
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  readonly gatewayRef: string;
  readonly collection: CollectionKind;
  /** A new pick asked the gateway to cancel this page before its charge landed. */
  readonly cancelRequested: boolean;
}

/**
 * Which subscription a gateway subscription or payment link collects for. `stray`: a checkout page
 * that can convert nothing — a new pick closed it, or its row already converted on another page —
 * so money on it is no subscription's to take.
 */
export type CollectedOn =
  | {
      readonly kind: 'collecting';
      readonly subscriptionId: string;
      /** The cycle it is paid on, for a charge the gateway names no period end for. */
      readonly cycle: BillingCycle | null;
      /** Set while the charge is the one that converts a trial: its checkout is still open. */
      readonly conversion: Conversion | null;
    }
  | { readonly kind: 'stray'; readonly subscriptionId: string };

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
 * The entitlement recompute (`M12-16`) rides `recordSuccess`'s transaction; the invoice
 * (T-M12-012) and the dunning clear (T-M12-011) join it.
 */
@Injectable()
export class ChargeAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /**
   * The subscription a gateway ref collects for: the row already converted on it, else the open
   * checkout that opened it on a row not yet converted. `null` when nothing knows the ref.
   */
  async collectedOn(gatewayRef: string): Promise<CollectedOn | null> {
    const [converted] = await this.db
      .select({ id: subscription.id, cycle: subscription.cycle })
      .from(subscription)
      .where(eq(subscription.gatewayRef, gatewayRef))
      .limit(1);
    if (converted !== undefined) {
      return {
        kind: 'collecting',
        subscriptionId: converted.id,
        cycle: converted.cycle,
        conversion: null,
      };
    }
    const [opened] = await this.db
      .select({
        checkoutId: billingCheckout.id,
        subscriptionId: billingCheckout.subscriptionId,
        planPriceId: billingCheckout.planPriceId,
        tier: planPrice.tier,
        cycle: planPrice.cycle,
        collection: billingCheckout.collection,
        cancelRequestedAt: billingCheckout.cancelRequestedAt,
        closedAt: billingCheckout.closedAt,
        convertedOn: subscription.gatewayRef,
      })
      .from(billingCheckout)
      .innerJoin(planPrice, eq(planPrice.id, billingCheckout.planPriceId))
      .innerJoin(subscription, eq(subscription.id, billingCheckout.subscriptionId))
      .where(eq(billingCheckout.gatewayRef, gatewayRef))
      .limit(1);
    if (opened === undefined) return null;
    const { subscriptionId, closedAt, convertedOn, cancelRequestedAt, ...chosen } = opened;
    if (closedAt !== null || convertedOn !== null) return { kind: 'stray', subscriptionId };
    return {
      kind: 'collecting',
      subscriptionId,
      cycle: chosen.cycle,
      conversion: { ...chosen, gatewayRef, cancelRequested: cancelRequestedAt !== null },
    };
  }

  /** The market whose book a subscription's limits come from; `null` for no such subscription. */
  async marketOf(subscriptionId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ marketCode: tenant.marketCode })
      .from(subscription)
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .where(eq(subscription.id, subscriptionId))
      .limit(1);
    return row?.marketCode ?? null;
  }

  async recordSuccess(
    charge: ChargeSucceeded,
    recordedAt: number,
    decide: (standing: ChargeStanding) => SuccessEffect,
    limitsFor: LimitsFor,
    conversion: Conversion | null = null,
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
      // The page was paid, whatever the charge does to the row: it can take no second payment.
      if (conversion !== null) await closeCheckout(tx, conversion.checkoutId, recordedAt);
      const effect = decide(held);
      if (effect.outcome === 'dead') return { kind: 'dead' };
      await applySuccess(tx, held, effect, charge.occurredAt, conversion);
      await recomputeEntitlements(tx, {
        tenantId: held.tenantId,
        subscriptionId: held.id,
        base: limitsFor(conversion?.tier ?? held.tier),
        now: recordedAt,
      });
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

/** A live charge's effect: the window, the state move and, on conversion, the plan. */
async function applySuccess(
  tx: DbTransaction,
  held: LockedSubscription,
  effect: Extract<SuccessEffect, { outcome: 'live' }>,
  occurredAt: number,
  conversion: Conversion | null,
): Promise<void> {
  await tx
    .update(subscription)
    .set({
      paidPeriodEnd: new Date(effect.paidPeriodEnd),
      ...(effect.moveTo === null
        ? {}
        : { state: effect.moveTo, stateEnteredAt: new Date(occurredAt) }),
      ...(conversion === null
        ? {}
        : {
            tier: conversion.tier,
            cycle: conversion.cycle,
            planPriceId: conversion.planPriceId,
            gatewayRef: conversion.gatewayRef,
          }),
    })
    .where(eq(subscription.id, held.id));
  if (effect.moveTo !== null) await recordState(tx, held, effect.moveTo, 'paid', occurredAt);
}

async function closeCheckout(tx: DbTransaction, checkoutId: string, at: number): Promise<void> {
  await tx
    .update(billingCheckout)
    .set({ closedAt: new Date(at) })
    .where(and(eq(billingCheckout.id, checkoutId), isNull(billingCheckout.closedAt)));
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
      tier: subscription.tier,
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
