import {
  BILLING_CYCLES,
  BILLING_NOTICES,
  BILLING_STATES,
  CANCELLATION_REASONS,
  COLLECTION_KINDS,
  ENTITLEMENT_LIMIT_KINDS,
  ENTITLEMENT_OVERRIDE_KINDS,
  ENTITLEMENT_SOURCES,
  INVOICE_KINDS,
  INVOICE_STATUSES,
  OVERAGE_ADDON_STATUSES,
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

/** A notice of the dunning ladder or a trial nudge (`M12-39`, `M12-42`). */
export const billingNoticeSchema = z.enum(BILLING_NOTICES);

/** How a checkout collects: a standing mandate, or one payment link (`M12-11`). */
export const collectionKindSchema = z.enum(COLLECTION_KINDS);

/** Where a company's limit comes from: plan, trial, or a support grant (`M12-16`). */
export const entitlementSourceSchema = z.enum(ENTITLEMENT_SOURCES);

/** A limit's case: a number, no ceiling, or negotiated (`BM-12`, `BM-15`). */
export const entitlementLimitKindSchema = z.enum(ENTITLEMENT_LIMIT_KINDS);

/** Support's two audited acts on a company's limits and trial (`M12-19`, `M12-52`). */
export const entitlementOverrideKindSchema = z.enum(ENTITLEMENT_OVERRIDE_KINDS);

/** What a platform invoice is for (`M12-44`, `M12-48`). */
export const invoiceKindSchema = z.enum(INVOICE_KINDS);

/** Where a platform invoice stands (`M12-44`). */
export const invoiceStatusSchema = z.enum(INVOICE_STATUSES);

/** Why an Owner cancelled (`M12-50`); the pgEnum `cancellation_reason` mirrors it. */
export const cancellationReasonSchema = z.enum(CANCELLATION_REASONS);

/** An overage add-on's life (`M12-35`); the pgEnum `overage_addon_status` mirrors it. */
export const overageAddOnStatusSchema = z.enum(OVERAGE_ADDON_STATUSES);

/**
 * Why a checkout could not open. `CHECKOUT_NOT_POSSIBLE`: the company's row is live past its trial
 * (`active`, `past_due`) — a trial converts and a dead row reactivates (`M12-08`). `TIER_NOT_SOLD`: the market's book
 * sells no price for that tier on that cycle (Enterprise is sold, never bought — `BM-15`).
 * `GATEWAY_UNAVAILABLE`: the gateway did not answer; nothing was opened, and the same call may be
 * sent again.
 */
export const checkoutErrorCodes = [
  'CHECKOUT_NOT_POSSIBLE',
  'TIER_NOT_SOLD',
  'GATEWAY_UNAVAILABLE',
] as const;

/**
 * Why a cancel or a refund did not happen. `CANCEL_NOT_POSSIBLE`: the row is not `active` — it is
 * a trial, already cancelled, or owed a payment (`M12-50`). `REFUND_NOT_POSSIBLE`: the company's
 * first paid cycle is past its window, or the row is no longer `active` (`M12-47`).
 */
export const billingActErrorCodes = [
  'CANCEL_NOT_POSSIBLE',
  'REFUND_NOT_POSSIBLE',
  'GATEWAY_UNAVAILABLE',
] as const;
export const billingActErrorCodeSchema = z.enum(billingActErrorCodes);

export const cancelRequestSchema = z.object({ reason: cancellationReasonSchema.nullable() });
export type CancelRequest = z.infer<typeof cancelRequestSchema>;

/** Service runs until the paid period ends (`M12-50`). */
export const cancelledSchema = z.object({ runsUntil: z.string().datetime() });

/** The refund went to its source; the credit note names it (`M12-47`). */
export const refundedSchema = z.object({ creditNoteNumber: z.string() });
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
 * same pick sent again answers the page already open, and a new pick closes that page first; from
 * a dead row it opens a new subscription's page (`M12-08`). `cancel` runs the row to its paid
 * period end (`M12-50`) and `refund` pays the first cycle back (`M12-47`): each locks the row, so a
 * second press moves nothing. `gatewayEvents` is that message's door: the gateway signs it,
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
  cancel: {
    method: 'POST',
    path: '/billing/cancel',
    body: cancelRequestSchema,
    responses: {
      200: cancelledSchema,
      401: unauthenticatedEnvelope,
      409: errorEnvelope(billingActErrorCodeSchema.extract(['CANCEL_NOT_POSSIBLE'])),
      502: errorEnvelope(billingActErrorCodeSchema.extract(['GATEWAY_UNAVAILABLE'])),
    },
  },
  refund: {
    method: 'POST',
    path: '/billing/refund',
    body: z.object({}).strict(),
    responses: {
      200: refundedSchema,
      401: unauthenticatedEnvelope,
      409: errorEnvelope(billingActErrorCodeSchema.extract(['REFUND_NOT_POSSIBLE'])),
      502: errorEnvelope(billingActErrorCodeSchema.extract(['GATEWAY_UNAVAILABLE'])),
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
