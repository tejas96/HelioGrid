import {
  billingCheckout,
  type DbTransaction,
  subscription,
  subscriptionStateHistory,
} from '@heliogrid/db';
import type { BillingState, ChargeStanding, MarketPack, SuccessEffect } from '@heliogrid/domain';
import { and, eq, isNull } from 'drizzle-orm';
import type { LockedSubscription } from './charge-standing.admin.repository';
import type { Conversion, Renewal } from './collected-on.admin.repository';
import { planBilledBy } from './invoice.admin.repository';
import { adoptRenewalPage } from './plan-move.admin.repository';

/**
 * How a charge moves its held row, inside charge truth's one transaction (`M12-09`): the
 * success's window, state and plan, a failure's state, and the history each move writes.
 */

/** Moves a held row as a failed charge at `occurredAt` moves it; whether it moved. */
export async function moveOnFailure(
  tx: DbTransaction,
  held: LockedSubscription,
  decide: (standing: ChargeStanding) => BillingState | null,
  occurredAt: number,
): Promise<boolean> {
  const to = decide(held);
  if (to === null) return false;
  await tx
    .update(subscription)
    .set({ state: to, stateEnteredAt: new Date(occurredAt) })
    .where(eq(subscription.id, held.id));
  await recordState(tx, held, to, 'charge_failed', occurredAt);
  return true;
}

/**
 * The plan row a live charge puts the row on: the converted plan, or the row a paid renewal's
 * invoice billed — today's book (`M12-57`). `null` leaves the row's plan as it is.
 */
export async function planPaidFor(
  tx: DbTransaction,
  tenantId: string,
  conversion: Conversion | null,
  renewal: Renewal | null,
): Promise<string | null> {
  if (conversion !== null) return conversion.planPriceId;
  return renewal === null ? null : planBilledBy(tx, tenantId, renewal.invoiceId);
}

/**
 * A live charge's effect: the window, the state move, the plan it paid and, on conversion, the
 * rest. A paid renewal of a row whose mandate a plan change ended makes its page the row's own.
 */
export async function applySuccess(
  tx: DbTransaction,
  held: LockedSubscription,
  effect: Extract<SuccessEffect, { outcome: 'live' }>,
  paid: {
    readonly occurredAt: number;
    readonly recordedAt: number;
    readonly conversion: Conversion | null;
    readonly renewal: Renewal | null;
    readonly plan: string | null;
    readonly pack: MarketPack;
  },
): Promise<void> {
  const { conversion, plan, occurredAt } = paid;
  await tx
    .update(subscription)
    .set({
      paidPeriodEnd: new Date(effect.paidPeriodEnd),
      ...(effect.moveTo === null
        ? {}
        : { state: effect.moveTo, stateEnteredAt: new Date(occurredAt) }),
      ...(plan === null ? {} : { planPriceId: plan }),
      ...(conversion === null
        ? {}
        : {
            tier: conversion.tier,
            cycle: conversion.cycle,
            gatewayRef: conversion.gatewayRef,
            collection: conversion.collection,
          }),
    })
    .where(eq(subscription.id, held.id));
  if (effect.moveTo !== null) await recordState(tx, held, effect.moveTo, 'paid', occurredAt);
  if (paid.renewal !== null) {
    await adoptRenewalPage(tx, held, { ...paid.renewal, at: paid.recordedAt }, paid.pack);
  }
}

export async function closeCheckout(
  tx: DbTransaction,
  checkoutId: string,
  at: number,
): Promise<void> {
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
