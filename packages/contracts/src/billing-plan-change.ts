import { PLAN_CHANGE_BLOCKS, PLAN_CHANGE_KINDS } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { billingCycleSchema, tierSchema } from './billing';
import { includesSchema, saleSchema } from './billing-home';
import { amountSchema, currencyCodeSchema, extensibleEnum } from './common';
import { errorEnvelope, unauthenticatedEnvelope } from './error';
import { limitSchema } from './pricing';

const c = initContract();
const instant = z.string().datetime();

/** What a pick on the plan screen is: a live paid row's change, or a conversion (`M12-54`). */
export const planChangeKindSchema = z.enum(PLAN_CHANGE_KINDS);

/**
 * Why a plan change did not happen. `PLAN_CHANGE_NOT_POSSIBLE`: the pick is the plan already held,
 * or the row is not `active` — a trial or a dead row converts through checkout, and a `past_due`
 * row pays what it owes first.
 * `PLAN_CHANGE_PREVIEW_CHANGED`: the usage under the preview moved since it was read (`M12-49`);
 * nothing was scheduled, and the screen reads the preview again. `TIER_NOT_SOLD`: no price on that
 * cycle (Enterprise is sold, never bought). `GATEWAY_UNAVAILABLE`: the gateway did not answer;
 * nothing was opened, and the same call may be sent again.
 */
export const planChangeErrorCodes = [
  'PLAN_CHANGE_NOT_POSSIBLE',
  'PLAN_CHANGE_PREVIEW_CHANGED',
  'TIER_NOT_SOLD',
  'GATEWAY_UNAVAILABLE',
] as const;
export const planChangeErrorCodeSchema = z.enum(planChangeErrorCodes);
export type PlanChangeErrorCode = z.infer<typeof planChangeErrorCodeSchema>;

export const planPickSchema = z.object({ tier: tierSchema, cycle: billingCycleSchema });
export type PlanPick = z.infer<typeof planPickSchema>;

/**
 * One thing the lower plan blocks: what is used now against the lower plan's limit, in the limit's
 * own unit as the book publishes it — storage is `used` in bytes against `limit` in GB.
 */
const planBlockSchema = z
  .object({
    block: extensibleEnum(PLAN_CHANGE_BLOCKS),
    used: z.number().int().nonnegative(),
    limit: limitSchema,
  })
  .strict();

/**
 * One review of one pick (`SCR-M12-03`), every amount worked out by the server (`F4-04`). `from`
 * is null on a trial, which holds no plan (`M12-52`). `today` is what is paid now — null on a
 * downgrade alone, which pays nothing today; its `partCycle` is the working of a mid-cycle charge (`M12-48`), null on a
 * conversion, whose first cycle is a whole one. `startsAt` is when the pick takes the money path:
 * the paid period's end for a change, now for a conversion. `blocks` is set on a downgrade alone —
 * empty when nothing is over the lower plan's limits. `digest` names the usage the preview read.
 */
export const planChangePreviewSchema = z
  .object({
    kind: extensibleEnum(PLAN_CHANGE_KINDS),
    from: planPickSchema.strict().nullable(),
    to: planPickSchema.strict(),
    currencyCode: currencyCodeSchema,
    taxScheme: z.string().nullable(),
    priceListPublishedAt: instant,
    includes: z.object({ from: includesSchema, to: includesSchema }).strict(),
    today: z
      .object({
        sale: saleSchema,
        partCycle: z
          .object({
            daysLeft: z.number().int().nonnegative(),
            daysInCycle: z.number().int().positive(),
            fromPrice: amountSchema,
            toPrice: amountSchema,
            toCycleDays: z.number().int().positive(),
            /** `toPrice − fromPrice`, set when both are prices for the same cycle. */
            difference: amountSchema.nullable(),
            /** Each cycle's price per day, as the working prints them (`dayRate`). */
            fromDayRate: amountSchema,
            toDayRate: amountSchema,
          })
          .strict()
          .nullable(),
      })
      .strict()
      .nullable(),
    startsAt: instant,
    nextBillAt: instant,
    afterwards: saleSchema,
    blocks: z.array(planBlockSchema).nullable(),
    digest: z.string().min(1),
  })
  .strict();
export type PlanChangePreview = z.infer<typeof planChangePreviewSchema>;

export const planChangeRequestSchema = planPickSchema.extend({
  previewDigest: z.string().min(1).max(128),
});
export type PlanChangeRequest = z.infer<typeof planChangeRequestSchema>;

/**
 * `page`: the provider's own page collects the part-cycle charge (`M12-48`). `applied`: nothing
 * was owed today and the plan moved at once. `scheduled`: the change waits for `effectiveAt`.
 */
export const planChangeOutcomeSchema = z.discriminatedUnion('outcome', [
  z.object({ outcome: z.literal('page'), checkoutUrl: z.string().url() }).strict(),
  z.object({ outcome: z.literal('applied') }).strict(),
  z.object({ outcome: z.literal('scheduled'), effectiveAt: instant }).strict(),
]);
export type PlanChangeOutcome = z.infer<typeof planChangeOutcomeSchema>;

/**
 * The plan screen's acts (`SCR-M12-03`), the Owner's alone (`M12-56`). `preview` reads one pick's
 * review; `change` acts on it and refuses a digest the usage has moved past (`M12-49`); `withdraw`
 * keeps the plan a scheduled change was moving from — answering 200 when nothing is scheduled, so
 * a second press moves nothing. A trial or a dead row converts through `billing.checkout`.
 */
export const billingPlanChangeContract = c.router({
  preview: {
    method: 'GET',
    path: '/billing/plan-change/preview',
    query: planPickSchema,
    summary: 'What a plan pick changes, costs today and blocks',
    responses: {
      200: planChangePreviewSchema,
      401: unauthenticatedEnvelope,
      409: errorEnvelope(planChangeErrorCodeSchema.extract(['PLAN_CHANGE_NOT_POSSIBLE'])),
      422: errorEnvelope(planChangeErrorCodeSchema.extract(['TIER_NOT_SOLD'])),
    },
  },
  change: {
    method: 'POST',
    path: '/billing/plan-change',
    body: planChangeRequestSchema,
    responses: {
      200: planChangeOutcomeSchema,
      401: unauthenticatedEnvelope,
      409: errorEnvelope(
        planChangeErrorCodeSchema.extract([
          'PLAN_CHANGE_NOT_POSSIBLE',
          'PLAN_CHANGE_PREVIEW_CHANGED',
        ]),
      ),
      422: errorEnvelope(planChangeErrorCodeSchema.extract(['TIER_NOT_SOLD'])),
      502: errorEnvelope(planChangeErrorCodeSchema.extract(['GATEWAY_UNAVAILABLE'])),
    },
  },
  withdraw: {
    method: 'POST',
    path: '/billing/plan-change/withdraw',
    body: z.object({}).strict(),
    responses: {
      200: z.object({ withdrawn: z.boolean() }).strict(),
      401: unauthenticatedEnvelope,
    },
  },
});
