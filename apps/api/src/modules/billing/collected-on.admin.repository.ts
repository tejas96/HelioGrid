import {
  billingCheckout,
  type Db,
  planPrice,
  subscription,
  subscriptionInvoice,
} from '@heliogrid/db';
import type { BillingCycle, CollectionKind, Tier } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';

/**
 * Which subscription a charge on a gateway ref lands on (`M12-09`): the read every charge fact
 * starts from, on the admin pool, since the gateway's messages cross every company.
 */

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

/** A renewal payment link (`M12-11`): the invoice it collects and the period end it buys. */
export interface Renewal {
  readonly invoiceId: string;
  readonly paysThrough: number;
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
      /** Set when the ref is a renewal link: the period it buys is its invoice's. */
      readonly renewal: Renewal | null;
    }
  | { readonly kind: 'stray'; readonly subscriptionId: string };

/**
 * The subscription a gateway ref collects for: the row already converted on it, else the
 * renewal invoice whose link it is, else the open checkout that opened it on a row not yet
 * converted. `null` when nothing knows the ref.
 */
export async function collectedOn(db: Db, gatewayRef: string): Promise<CollectedOn | null> {
  const [converted] = await db
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
      renewal: null,
    };
  }
  const [renewing] = await db
    .select({
      invoiceId: subscriptionInvoice.id,
      subscriptionId: subscriptionInvoice.subscriptionId,
      paysThrough: subscriptionInvoice.paysThrough,
      cycle: subscription.cycle,
    })
    .from(subscriptionInvoice)
    .innerJoin(subscription, eq(subscription.id, subscriptionInvoice.subscriptionId))
    .where(eq(subscriptionInvoice.gatewayRef, gatewayRef))
    .limit(1);
  if (renewing !== undefined) {
    return {
      kind: 'collecting',
      subscriptionId: renewing.subscriptionId,
      cycle: renewing.cycle,
      conversion: null,
      renewal: { invoiceId: renewing.invoiceId, paysThrough: renewing.paysThrough.getTime() },
    };
  }
  const [opened] = await db
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
    renewal: null,
  };
}
