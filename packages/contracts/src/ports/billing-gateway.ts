import type {
  BillingCycle,
  CollectionKind,
  CollectionRoute,
  MinorUnits,
  Tier,
} from '@heliogrid/domain';

/**
 * The port platform billing reaches its gateway through (`M12-03`): plan objects, hosted checkout,
 * the gateway's signed messages and the reconcile poll. Every shape here is provider-neutral; an
 * adapter turns its gateway's own objects into these, and a second market adds an adapter, never
 * a field. The platform never sees a payment instrument (`M12-10`): nothing here carries one.
 *
 * Every moment is the gateway's, in epoch milliseconds. Every amount is whole minor units of the
 * company's one currency, tax included — what the gateway collects.
 */

/** One plan object at the gateway: a tier on a cycle at one amount (`M12-12`). */
export interface GatewayPlanRequest {
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  readonly currencyCode: string;
  readonly amount: MinorUnits;
}

/** A hosted checkout to open for a company converting (`M12-54`). */
export interface GatewayCheckoutRequest {
  /** How the pack's ladder collects this tier on this cycle (`M12-11`). */
  readonly route: CollectionRoute;
  /** The plan object, for a mandate route; a payment link carries the amount alone. */
  readonly gatewayPlanRef: string;
  readonly amount: MinorUnits;
  readonly currencyCode: string;
  /** Our checkout's id, carried by the gateway on every message about it. */
  readonly checkoutId: string;
  /** The hosted page stops taking money at this moment: the trial's end. */
  readonly expiresAt: number;
}

export interface OpenedCheckout {
  /** The gateway's id for the subscription (mandate) or payment link (invoice) it opened. */
  readonly gatewayRef: string;
  /** The gateway's own page; the product collects nothing itself (`M12-10`). */
  readonly hostedUrl: string;
}

/** A charge the gateway collected, as its message or its poll reports it. */
export interface GatewayCharge {
  /** The subscription or payment link it was collected on. */
  readonly gatewayRef: string;
  readonly chargeRef: string;
  readonly occurredAt: number;
  /** The end of the period it pays for; `null` where the gateway names none (a payment link). */
  readonly paysThrough: number | null;
  readonly amount: MinorUnits;
  readonly currencyCode: string;
}

/**
 * What one signed message says. `paused` and `resumed` exist because a gateway can emit them;
 * the product offers no pause, so they are alerted and never applied (`M12-13`). `other` is every
 * message billing does not act on.
 */
export type GatewayEvent = { readonly eventRef: string } & (
  | { readonly kind: 'charged'; readonly charge: GatewayCharge }
  | { readonly kind: 'charge_failed'; readonly gatewayRef: string; readonly occurredAt: number }
  | { readonly kind: 'paused' | 'resumed'; readonly gatewayRef: string }
  | { readonly kind: 'other'; readonly type: string }
);

export interface BillingGateway {
  /** The provider's name for the transport dedupe key. Never shown, never branched on. */
  readonly provider: string;
  /** Creates the plan object and answers its gateway ref. */
  createPlan(request: GatewayPlanRequest): Promise<string>;
  /** Opens the hosted page. Throws when the gateway does not answer; nothing is then opened. */
  openCheckout(request: GatewayCheckoutRequest): Promise<OpenedCheckout>;
  /**
   * Closes a hosted page so it can take no more money. Safe to send again: a page the gateway
   * already cancelled, expired or saw paid counts as closed. Throws only when the page may still
   * take money.
   */
  closeCheckout(collection: CollectionKind, gatewayRef: string): Promise<void>;
  /**
   * The message, when its signature holds; `null` when it does not. `headers` are the request's,
   * lower-cased, so each adapter reads its own signature header.
   */
  readEvent(rawBody: Uint8Array, headers: Readonly<Record<string, string>>): GatewayEvent | null;
  /** Every charge the gateway collected on this subscription or payment link (the reconcile poll). */
  chargesOn(collection: CollectionKind, gatewayRef: string): Promise<readonly GatewayCharge[]>;
}

/** A `symbol` on purpose: a string DI token collides silently across modules. */
export const BILLING_GATEWAY = Symbol.for('heliogrid.BillingGateway');
