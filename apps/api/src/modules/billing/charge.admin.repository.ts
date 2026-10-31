import {
  billingCheckout,
  type Db,
  type DbTransaction,
  subscription,
  subscriptionInvoice,
  subscriptionPayment,
  subscriptionStateHistory,
  tenant,
} from '@heliogrid/db';
import {
  type BillingState,
  type ChargeFailed,
  type ChargeStanding,
  type ChargeSucceeded,
  type MarketPack,
  type MinorUnits,
  type SuccessEffect,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { clearOpenNotices } from './billing-notice.admin.repository';
import { type LockedSubscription, lockSubscription } from './charge-standing.admin.repository';
import {
  type CollectedOn,
  type Conversion,
  collectedOn,
  type Renewal,
} from './collected-on.admin.repository';
import { type LimitsFor, recomputeEntitlements } from './entitlement.admin.repository';
import { issueInvoice, payRenewalInvoice, planBilledBy } from './invoice.admin.repository';
import { addOnsCollectedBy } from './overage-invoicing.admin.repository';

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

  /** The subscription a gateway ref collects for (`collected-on.admin.repository.ts`). */
  collectedOn(gatewayRef: string): Promise<CollectedOn | null> {
    return collectedOn(this.db, gatewayRef);
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
    renewal: Renewal | null = null,
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
      // A renewal link's payment pays the invoice raised with it; its add-ons are already on it.
      const collectedOn = conversion?.gatewayRef ?? held.gatewayRef;
      const issue = async () =>
        (renewal === null ? null : await payRenewalInvoice(tx, renewal.invoiceId, paid.id)) ??
        issueInvoice(
          tx,
          {
            tenantId: held.tenantId,
            subscriptionId: held.id,
            planPriceId: conversion?.planPriceId ?? held.planPriceId,
            paysThrough: charge.paysThrough,
            issuedAt: recordedAt,
            pack,
            addOns:
              collectedOn === null || renewal !== null
                ? []
                : await addOnsCollectedBy(tx, {
                    tenantId: held.tenantId,
                    subscriptionId: held.id,
                    gatewayRef: collectedOn,
                    occurredAt: charge.occurredAt,
                  }),
          },
          { kind: 'payment', paymentId: paid.id },
        );
      // The page was paid, whatever the charge does to the row: it can take no second payment.
      if (conversion !== null) await closeCheckout(tx, conversion.checkoutId, recordedAt);
      const effect = decide(held);
      if (effect.outcome === 'dead') return { kind: 'dead', invoiced: await issue() };
      const plan = await planPaidFor(tx, held.tenantId, conversion, renewal);
      await applySuccess(tx, held, effect, charge.occurredAt, conversion, plan);
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

  /**
   * A renewal still unpaid at its due moment is the failed charge (`M12-05`): its invoice turns
   * `failed`, and the row moves as a failure moves it, at that moment, in one transaction. The
   * row's lock comes first, so a payment landing at the same moment either paid the invoice
   * already — nothing changes — or waits and then pays the `failed` one. `null`: no longer
   * `issued`.
   */
  async recordRenewalUnpaid(
    renewal: { invoiceId: string; subscriptionId: string; dueAt: number },
    decide: (standing: ChargeStanding) => BillingState | null,
  ): Promise<boolean | null> {
    return this.db.transaction(async (tx) => {
      const held = await lockSubscription(tx, renewal.subscriptionId);
      if (held === null) return null;
      const [failed] = await tx
        .update(subscriptionInvoice)
        .set({ status: 'failed' })
        .where(
          and(
            eq(subscriptionInvoice.id, renewal.invoiceId),
            eq(subscriptionInvoice.status, 'issued'),
          ),
        )
        .returning({ id: subscriptionInvoice.id });
      if (failed === undefined) return null;
      return moveOnFailure(tx, held, decide, renewal.dueAt);
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
      return moveOnFailure(tx, held, decide, failure.occurredAt);
    });
  }
}

/** Moves a held row as a failed charge at `occurredAt` moves it; whether it moved. */
async function moveOnFailure(
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
async function planPaidFor(
  tx: DbTransaction,
  tenantId: string,
  conversion: Conversion | null,
  renewal: Renewal | null,
): Promise<string | null> {
  if (conversion !== null) return conversion.planPriceId;
  return renewal === null ? null : planBilledBy(tx, tenantId, renewal.invoiceId);
}

/** A live charge's effect: the window, the state move, the plan it paid and, on conversion, the rest. */
async function applySuccess(
  tx: DbTransaction,
  held: LockedSubscription,
  effect: Extract<SuccessEffect, { outcome: 'live' }>,
  occurredAt: number,
  conversion: Conversion | null,
  plan: string | null,
): Promise<void> {
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
        : { tier: conversion.tier, cycle: conversion.cycle, gatewayRef: conversion.gatewayRef }),
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
