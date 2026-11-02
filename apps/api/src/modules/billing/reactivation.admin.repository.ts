import {
  billingCheckout,
  type DbTransaction,
  subscription,
  subscriptionPayment,
  subscriptionStateHistory,
  uuidv7,
} from '@heliogrid/db';
import type { ChargeSucceeded, MarketPack, MinorUnits } from '@heliogrid/domain';
import { and, eq, isNull } from 'drizzle-orm';
import { recordAuditEntry } from '../audit/audit.public';
import { clearOpenNotices } from './billing-notice.admin.repository';
import type { LockedSubscription } from './charge-standing.admin.repository';
import type { Conversion } from './collected-on.admin.repository';
import { type LimitsFor, recomputeEntitlements } from './entitlement.admin.repository';
import { issueInvoice } from './invoice.admin.repository';

/** What a reactivation charge came to: the total its invoice issued for, or a charge told before. */
export type Reactivated =
  | { readonly kind: 'recorded'; readonly invoiced: MinorUnits }
  | {
      readonly kind: 'duplicate';
    };

/**
 * Reactivation's half of the charge transaction (`M12-08`): a charge on a page a dead row opened
 * starts a NEW `active` row with the page's plan — the old row stays as it was, and its mandate is
 * never resumed. The dead row is already held `FOR UPDATE` and no live row replaced it, so one
 * company holds one live row. The payment, the invoice, the history, the dunning clear, the
 * limits and the audit entry all ride the one transaction, so entitlements are live the moment it
 * commits and no record is touched.
 */
export async function startReactivated(
  tx: DbTransaction,
  held: LockedSubscription,
  charge: ChargeSucceeded,
  context: {
    readonly recordedAt: number;
    /** The page the charge was collected on; domain reactivates only on one (`successEffect`). */
    readonly conversion: Conversion | null;
    readonly effect: { readonly paidPeriodEnd: number };
    readonly pack: MarketPack;
    readonly limitsFor: LimitsFor;
  },
): Promise<Reactivated> {
  const { conversion, recordedAt } = context;
  if (conversion === null) throw new Error(`a reactivation on ${held.id} came from no page`);
  // The held lock serialises every charge on this row, so a message sent twice sees the first.
  const [told] = await tx
    .select({ id: subscriptionPayment.id })
    .from(subscriptionPayment)
    .where(eq(subscriptionPayment.gatewayChargeRef, charge.chargeRef))
    .limit(1);
  if (told !== undefined) return { kind: 'duplicate' };
  const startedAt = new Date(charge.occurredAt);
  const [started] = await tx
    .insert(subscription)
    .values({
      id: uuidv7(),
      tenantId: held.tenantId,
      state: 'active',
      stateEnteredAt: startedAt,
      paidPeriodEnd: new Date(context.effect.paidPeriodEnd),
      createdAt: new Date(recordedAt),
      tier: conversion.tier,
      cycle: conversion.cycle,
      planPriceId: conversion.planPriceId,
      gatewayRef: conversion.gatewayRef,
      collection: conversion.collection,
    })
    .returning({ id: subscription.id });
  if (started === undefined) throw new Error('the reactivated subscription was not written');
  await tx.insert(subscriptionStateHistory).values({
    tenantId: held.tenantId,
    subscriptionId: started.id,
    state: 'active',
    cause: 'paid',
    enteredAt: startedAt,
  });
  const [paid] = await tx
    .insert(subscriptionPayment)
    .values({
      tenantId: held.tenantId,
      subscriptionId: started.id,
      gatewayChargeRef: charge.chargeRef,
      amountMinor: charge.amount,
      currencyCode: charge.currencyCode,
      paysThrough: new Date(charge.paysThrough),
      occurredAt: startedAt,
      recordedAt: new Date(recordedAt),
    })
    .returning({ id: subscriptionPayment.id });
  if (paid === undefined) throw new Error('the reactivation payment was not written');
  await clearOpenNotices(tx, held.tenantId, paid.id, recordedAt);
  await recomputeEntitlements(tx, {
    tenantId: held.tenantId,
    subscriptionId: started.id,
    base: context.limitsFor(conversion.tier),
    now: recordedAt,
  });
  if (conversion.openedBy !== null) {
    await recordAuditEntry(tx, {
      tenantId: held.tenantId,
      eventType: 'billing.reactivated',
      actorKind: 'tenant_user',
      actorRef: conversion.openedBy,
      occurredAt: new Date(recordedAt),
      blocked: false,
      subjectKind: 'subscription',
      subjectRef: started.id,
      changePayload: null,
    });
  }
  // The series row is taken last, so other charges in the market wait on it as briefly as can be.
  const invoiced = await issueInvoice(
    tx,
    {
      tenantId: held.tenantId,
      subscriptionId: started.id,
      planPriceId: conversion.planPriceId,
      paysThrough: charge.paysThrough,
      issuedAt: recordedAt,
      pack: context.pack,
      addOns: [],
    },
    { kind: 'payment', paymentId: paid.id },
  );
  // The page was paid: it can take no second payment.
  await tx
    .update(billingCheckout)
    .set({ closedAt: new Date(recordedAt) })
    .where(and(eq(billingCheckout.id, conversion.checkoutId), isNull(billingCheckout.closedAt)));
  return { kind: 'recorded', invoiced };
}
