import {
  BILLING_CYCLES,
  BILLING_STATES,
  COLLECTION_KINDS,
  ENTITLEMENT_LIMIT_KINDS,
  ENTITLEMENT_OVERRIDE_KINDS,
  ENTITLEMENT_SOURCES,
  SUBSCRIPTION_CAUSES,
  TIERS,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { errorEnvelope, unauthenticatedEnvelope } from './error';

const c = initContract();

/**
 * The subscription's two vocabularies, built from `@heliogrid/domain` and never restated. The
 * migration mirrors each as a pgEnum (invariant `enum-parity`), so a value on one side alone is a
 * row the API can never return or a value the database rejects.
 */

/** The six billing states (`BM-33`, `M12-04`). */
export const billingStateSchema = z.enum(BILLING_STATES);

/** Why a subscription entered a state — the history's cause (`M12-04`). */
export const subscriptionCauseSchema = z.enum(SUBSCRIPTION_CAUSES);

/** The four tiers (`BM-11`). */
export const tierSchema = z.enum(TIERS);

/** Monthly or yearly (`BM-13`). */
export const billingCycleSchema = z.enum(BILLING_CYCLES);

/** How a checkout collects: a standing mandate, or one payment link (`M12-11`). */
export const collectionKindSchema = z.enum(COLLECTION_KINDS);

/** Where a company's limit comes from: plan, trial, or a support grant (`M12-16`). */
export const entitlementSourceSchema = z.enum(ENTITLEMENT_SOURCES);

/** A limit's case: a number, no ceiling, or negotiated (`BM-12`, `BM-15`). */
export const entitlementLimitKindSchema = z.enum(ENTITLEMENT_LIMIT_KINDS);

/** Support's two audited acts on a company's limits and trial (`M12-19`, `M12-52`). */
export const entitlementOverrideKindSchema = z.enum(ENTITLEMENT_OVERRIDE_KINDS);

/**
 * Why a checkout could not open. `CHECKOUT_NOT_POSSIBLE`: the company is not on a trial — paying
 * from a lapsed state is reactivation (`M12-08`, T-M12-002). `TIER_NOT_SOLD`: the market's book
 * sells no price for that tier on that cycle (Enterprise is sold, never bought — `BM-15`).
 * `GATEWAY_UNAVAILABLE`: the gateway did not answer; nothing was opened, and the same call may be
 * sent again.
 */
export const checkoutErrorCodes = [
  'CHECKOUT_NOT_POSSIBLE',
  'TIER_NOT_SOLD',
  'GATEWAY_UNAVAILABLE',
] as const;
export const checkoutErrorCodeSchema = z.enum(checkoutErrorCodes);
export type CheckoutErrorCode = z.infer<typeof checkoutErrorCodeSchema>;

export const checkoutRequestSchema = z.object({
  tier: tierSchema,
  cycle: billingCycleSchema,
});
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

/** The gateway's own page. The product collects nothing sensitive itself (`M12-10`). */
export const checkoutOpenedSchema = z.object({ checkoutUrl: z.string().url() });
export type CheckoutOpened = z.infer<typeof checkoutOpenedSchema>;

/**
 * Platform billing (`M12`). `checkout` converts a trial (`M12-54`): it opens the gateway's hosted
 * page on the rail the market's ladder names (`M12-11`), and the company turns `active` when the
 * gateway's message says it paid. It is idempotent by its own rule, so it takes no retry key: the
 * same pick sent again answers the page already open, and a new pick closes that page first. `gatewayEvents` is that message's door: the gateway signs it,
 * so the signature is its only authentication, and every message the api handled, refused or has
 * seen before answers 200 so the gateway stops sending it.
 */
export const billingContract = c.router({
  checkout: {
    method: 'POST',
    path: '/billing/checkout',
    body: checkoutRequestSchema,
    responses: {
      200: checkoutOpenedSchema,
      401: unauthenticatedEnvelope,
      409: errorEnvelope(checkoutErrorCodeSchema.extract(['CHECKOUT_NOT_POSSIBLE'])),
      422: errorEnvelope(checkoutErrorCodeSchema.extract(['TIER_NOT_SOLD'])),
      502: errorEnvelope(checkoutErrorCodeSchema.extract(['GATEWAY_UNAVAILABLE'])),
    },
  },
  gatewayEvents: {
    method: 'POST',
    path: '/billing/gateway-events',
    body: z.unknown(),
    responses: {
      200: z.object({ received: z.literal(true) }),
      401: errorEnvelope(z.literal('SIGNATURE_INVALID')),
    },
  },
});
