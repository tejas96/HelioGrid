import {
  billingCheckout,
  type Db,
  planPrice,
  subscription,
  subscriptionInvoice,
} from '@heliogrid/db';
import {
  type BillingCycle,
  type CollectionKind,
  LIVE_BILLING_STATES,
  type MinorUnits,
  minorUnits,
  type Tier,
} from '@heliogrid/domain';
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
  /** Where the period it buys begins, when not at the charge: a running cancelled row's end. */
  readonly startsAt: number | null;
  /** The Owner who opened it; null on a page opened before it was recorded. */
  readonly openedBy: string | null;
  /**
   * The page was opened after its row died, so its charge starts a new row (`M12-08`). A trial's
   * own page paid after the trial ended is not one: that charge is dead, and alerted.
   */
  readonly reactivates: boolean;
}

/**
 * An upgrade's part-cycle page (`M12-48`), open on the live row it moves: its charge moves the row
 * to the plan it pays toward and keeps the paid period's end.
 */
export interface PlanChangePaid {
  readonly checkoutId: string;
  readonly planPriceId: string;
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  /** The charge for the days left, ex-tax: the proration invoice's one line. */
  readonly chargeMinor: MinorUnits;
  /** The plan and the paid period's end the charge was priced on: a row that moved is refused. */
  readonly fromPlanPriceId: string;
  readonly pricedThrough: number;
  /** The Owner who opened it: the change is their act (`M12-56`). */
  readonly openedBy: string | null;
}

/** A renewal payment link (`M12-11`): the invoice it collects and the period end it buys. */
export interface Renewal {
  readonly invoiceId: string;
  readonly paysThrough: number;
  /** The link or mandate the renewal was raised on. */
  readonly gatewayRef: string;
}

/**
 * Which subscription a gateway subscription or payment link collects for. `plan_change`: an
 * upgrade's part-cycle page on its live row. `stray`: a checkout page that can convert nothing — a new pick closed it, or its live row already converted on another
 * page — so money on it is no subscription's to take. A page a dead row opened is reactivation,
 * though the row still names its old mandate (`M12-08`).
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
  | { readonly kind: 'plan_change'; readonly subscriptionId: string; readonly page: PlanChangePaid }
  | { readonly kind: 'stray'; readonly subscriptionId: string };

/**
 * The subscription a gateway ref collects for: the row already converted on it, else the
 * renewal invoice whose link it is, else the open checkout that opened it on a row not yet
 * converted. `null` when nothing knows the ref.
 */
const LIVE: ReadonlySet<string> = new Set(LIVE_BILLING_STATES);

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
      renewal: {
        invoiceId: renewing.invoiceId,
        paysThrough: renewing.paysThrough.getTime(),
        gatewayRef,
      },
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
      startsAt: billingCheckout.startsAt,
      openedBy: billingCheckout.openedBy,
      convertedOn: subscription.gatewayRef,
      state: subscription.state,
      stateEnteredAt: subscription.stateEnteredAt,
      openedAt: billingCheckout.openedAt,
      purpose: billingCheckout.purpose,
      chargeMinor: billingCheckout.chargeMinor,
      fromPlanPriceId: billingCheckout.fromPlanPriceId,
      expiresAt: billingCheckout.expiresAt,
    })
    .from(billingCheckout)
    .innerJoin(planPrice, eq(planPrice.id, billingCheckout.planPriceId))
    .innerJoin(subscription, eq(subscription.id, billingCheckout.subscriptionId))
    .where(eq(billingCheckout.gatewayRef, gatewayRef))
    .limit(1);
  if (opened === undefined) return null;
  const {
    subscriptionId,
    closedAt,
    convertedOn,
    cancelRequestedAt,
    startsAt,
    state,
    stateEnteredAt,
    openedAt,
    purpose,
    chargeMinor,
    fromPlanPriceId,
    expiresAt,
    ...chosen
  } = opened;
  const liveAndConverted = convertedOn !== null && LIVE.has(state);
  // An upgrade's page pays only while its row is still the live one it was opened on.
  if (purpose === 'plan_change') {
    if (
      closedAt !== null ||
      !liveAndConverted ||
      chargeMinor === null ||
      fromPlanPriceId === null
    ) {
      return { kind: 'stray', subscriptionId };
    }
    const { checkoutId, planPriceId, tier, cycle, openedBy } = chosen;
    return {
      kind: 'plan_change',
      subscriptionId,
      page: {
        checkoutId,
        planPriceId,
        tier,
        cycle,
        openedBy,
        chargeMinor: minorUnits(chargeMinor),
        fromPlanPriceId,
        // An upgrade's page stops taking money at the paid period's end it was priced on.
        pricedThrough: expiresAt.getTime(),
      },
    };
  }
  if (closedAt !== null || liveAndConverted) return { kind: 'stray', subscriptionId };
  return {
    kind: 'collecting',
    subscriptionId,
    cycle: chosen.cycle,
    conversion: {
      ...chosen,
      gatewayRef,
      cancelRequested: cancelRequestedAt !== null,
      startsAt: startsAt?.getTime() ?? null,
      reactivates: !LIVE.has(state) && openedAt >= stateEnteredAt,
    },
    renewal: null,
  };
}
