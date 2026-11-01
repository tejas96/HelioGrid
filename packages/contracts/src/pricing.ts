import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { billingCycleSchema, tierSchema } from './billing';
import { amountSchema, currencyCodeSchema } from './common';
import { baseError, errorEnvelope } from './error';
import { marketCodeSchema } from './market';

const c = initContract();

/** A ceiling, count or bundle: a number, no ceiling, or negotiated (`BM-12`, `BM-15`). */
const limitSchema = z.union([
  z.number().int().nonnegative(),
  z.literal('unlimited'),
  z.literal('custom'),
]);

const priceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('listed'),
    perCycle: z.object({ monthly: amountSchema, yearly: amountSchema }).strict(),
  }),
  z.object({ kind: z.literal('anchored'), from: amountSchema, per: billingCycleSchema }),
]);

/** A draft rate travels as `unpublished`, never as its figure (`BM-26`). */
const rateSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('published'), rate: amountSchema }),
  z.object({ kind: z.literal('unpublished') }),
  z.object({ kind: z.literal('custom') }),
]);

const planSchema = z
  .object({
    tier: tierSchema,
    price: priceSchema,
    designCeilingKw: limitSchema,
    proposalsPerMonth: limitSchema,
    activeProjects: limitSchema,
    voiceMinutesIncluded: limitSchema,
    voiceMinuteRate: rateSchema,
    storageGb: limitSchema,
  })
  .strict();

/**
 * What the public pricing page prints of a market's book (`SCR-M12-01`): `publicPricing` in
 * `@heliogrid/domain`, with money as decimal strings in the market's currency. `.strict()` turns a
 * leaked book field — a worst-case cost, a draft figure — into a response failure.
 */
export const publicPricingSchema = z
  .object({
    market: marketCodeSchema,
    /** The pack revision's publish instant: the price list's date on the page (`F1-25`). */
    publishedAt: z.string().datetime(),
    currencyCode: currencyCodeSchema,
    plans: z.array(planSchema).min(1),
    trial: z
      .object({
        days: z.number().int().positive(),
        designCeilingKw: limitSchema,
        proposalsPerMonth: limitSchema,
        voiceMinutes: limitSchema,
        storageGb: limitSchema,
      })
      .strict(),
    comparisons: z.array(
      z
        .object({
          tier: tierSchema,
          designCeilingKw: z.number().int().positive(),
          cycle: billingCycleSchema,
          ours: amountSchema,
          competitor: z.string(),
          rung: z.string(),
          theirs: amountSchema,
        })
        .strict(),
    ),
    benchmarkSources: z.array(
      z.object({ competitor: z.string(), source: z.string(), readOn: z.string() }).strict(),
    ),
    taxScheme: z.string(),
    taxExcluded: z.boolean(),
    salesContact: z.string().email().nullable(),
  })
  .strict();
export type PublicPricingRead = z.infer<typeof publicPricingSchema>;

export const pricingContract = c.router({
  current: {
    method: 'GET',
    path: '/pricing/:marketCode',
    pathParams: z.object({ marketCode: marketCodeSchema }),
    summary: 'The public price list of one market: plans, limits, trial caps and benchmarks',
    responses: {
      200: publicPricingSchema,
      404: errorEnvelope(baseError('NOT_FOUND')),
    },
  },
});
