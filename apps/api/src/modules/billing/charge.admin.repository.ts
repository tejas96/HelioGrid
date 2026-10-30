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
  type MarketPack,
  type MinorUnits,
  type SuccessEffect,
  type Tier,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { clearOpenNotices } from './billing-notice.admin.repository';
import { type LockedSubscription, lockSubscription } from './charge-standing.admin.repository';
import { type LimitsFor, recomputeEntitlements } from './entitlement.admin.repository';
import { issueInvoice } from './invoice.admin.repository';
import { addOnsCollectedBy } from './overage-invoicing.admin.repository';

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

/** What one charge came to; a recorded payment names the total its invoice issued for. */
export type SuccessRecorded =
  | { readonly kind: 'recorded' | 'dead'; readonly invoiced: MinorUnits }
  | { readonly kind: 'duplicate' }
  | { readonly kind: 'unknown subscription' }
  | { readonly kind: 'another currency'; readonly companyCurrency: string };

/**
 * Charge truth's one transaction (`M12-09`). A gateway's messages cross every company, so this rides
 * the admin pool. The subscription row is read `FOR UPDATE` first: a charge, a failure and the
 * timers' conditional move each find it where the one before left it. What a charge does is
 * domain's; the caller hands it in as `decide`.
 *
 * The invoice (`M12-44`) with the overage add-ons the debit collected (`M12-35`), the entitlement recompute (`M12-16`) and the dunning clear (`M12-39`)
 * ride `recordSuccess`'s transaction: every recorded payment issues its invoice, a dead one's too.
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
    pack: MarketPack,
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
      // The invoice takes its market's series row: taken last, so every other charge in the market
      // waits on it for as short a time as the transaction allows.
      const collectedOn = conversion?.gatewayRef ?? held.gatewayRef;
      const issue = async () =>
        issueInvoice(tx, {
          tenantId: held.tenantId,
          subscriptionId: held.id,
          paymentId: paid.id,
          planPriceId: conversion?.planPriceId ?? held.planPriceId,
          paysThrough: charge.paysThrough,
          issuedAt: recordedAt,
          pack,
          addOns:
            collectedOn === null
              ? []
              : await addOnsCollectedBy(tx, {
                  tenantId: held.tenantId,
                  subscriptionId: held.id,
                  gatewayRef: collectedOn,
                  occurredAt: charge.occurredAt,
                }),
        });
      // The page was paid, whatever the charge does to the row: it can take no second payment.
      if (conversion !== null) await closeCheckout(tx, conversion.checkoutId, recordedAt);
      const effect = decide(held);
      if (effect.outcome === 'dead') return { kind: 'dead', invoiced: await issue() };
      await applySuccess(tx, held, effect, charge.occurredAt, conversion);
      // Only a charge that moves the row ends its unpaid spell; a late one leaves the ladder running.
      if (effect.moveTo !== null) await clearOpenNotices(tx, held.tenantId, paid.id, recordedAt);
      await recomputeEntitlements(tx, {
        tenantId: held.tenantId,
        subscriptionId: held.id,
        base: limitsFor(conversion?.tier ?? held.tier),
        now: recordedAt,
      });
      return { kind: 'recorded', invoiced: await issue() };
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
