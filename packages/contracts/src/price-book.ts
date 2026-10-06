import { MAX_MARGIN, PRICE_BOOK_RATE_BASES, percentToBasisPoints } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { priceSchema } from './catalog';
import {
  createHeadersSchema,
  currencyCodeSchema,
  paginated,
  paginationQuerySchema,
  percentSchema,
  uuidSchema,
} from './common';
import { labelSchema, lineSchema, perLanguage } from './document-content';
import { baseError, errorEnvelope, IDEMPOTENCY_KEY_REUSED } from './error';

const c = initContract();

/**
 * The price book (`M01-48`, `T-M01-031`): a tenant's rates for everything that is not a catalog
 * item, kept as immutable versions; the newest is the one in force. Every route is the catalog's
 * money grant's (§M01.5): a rate and a margin are money, so a reader without it gets 403 rather
 * than a list of names.
 */

export const priceBookRateBasisSchema = z.enum(PRICE_BOOK_RATE_BASES);

/** A request-size bound on one version's rates; the drawn rates panel holds eleven. */
export const MAX_RATES_PER_VERSION = 100;

/**
 * A version's default margin: the builder's starting margin, so never above what it accepts. Zod
 * runs this refine even when `percentSchema` already failed, and the parse throws on such text — so
 * malformed text answers false here, keeping the refusal a 400 and never a 500.
 */
const defaultMarginPctSchema = percentSchema.refine((pct) => {
  try {
    return percentToBasisPoints(pct) <= MAX_MARGIN;
  } catch {
    return false;
  }
}, 'a default margin is at most the builder’s highest margin');

/** One rate: the tenant's name for it (`F3-10`), how it applies, and its amount. */
export const priceBookRateSchema = z.object({
  name: perLanguage(labelSchema),
  basis: priceBookRateBasisSchema,
  amount: priceSchema,
});
export type PriceBookRateWire = z.infer<typeof priceBookRateSchema>;

/** Who published a version, as the version browse names them; an account may hold no name. */
const publisherSchema = z.object({ id: uuidSchema, name: z.string().nullable() });

/** A version's head: its number, when and by whom, and the publisher's sentence on what changed. */
export const priceBookVersionHeadSchema = z.object({
  id: uuidSchema,
  number: z.number().int().positive(),
  publishedAt: z.string().datetime(),
  publishedBy: publisherSchema,
  note: z.string(),
});
export type PriceBookVersionHeadWire = z.infer<typeof priceBookVersionHeadSchema>;

/** One row of the version list: the head, its margin, how many rates, and whether it is in force. */
export const priceBookVersionSummarySchema = priceBookVersionHeadSchema.extend({
  defaultMarginPct: percentSchema,
  rateCount: z.number().int().nonnegative(),
  active: z.boolean(),
});
export type PriceBookVersionSummaryWire = z.infer<typeof priceBookVersionSummarySchema>;

/** One version in full, read-only. */
export const priceBookVersionSchema = priceBookVersionSummarySchema.extend({
  currencyCode: currencyCodeSchema,
  rates: z.array(priceBookRateSchema),
});
export type PriceBookVersionWire = z.infer<typeof priceBookVersionSchema>;

/**
 * The rate card in force: the newest version, or — before a company's first publish — no version,
 * no rates and the platform default margin (§M01.5, owner ruling 1A).
 */
export const priceBookActiveSchema = z.object({
  version: priceBookVersionHeadSchema.nullable(),
  defaultMarginPct: percentSchema,
  currencyCode: currencyCodeSchema,
  rates: z.array(priceBookRateSchema),
});
export type PriceBookActiveWire = z.infer<typeof priceBookActiveSchema>;

/** The publish act: the whole rate set, its default margin and the publisher's note. */
export const priceBookPublishSchema = z.object({
  note: lineSchema,
  defaultMarginPct: defaultMarginPctSchema,
  rates: z.array(priceBookRateSchema).max(MAX_RATES_PER_VERSION),
});
export type PriceBookPublish = z.infer<typeof priceBookPublishSchema>;

const guarded = {
  401: errorEnvelope(baseError('UNAUTHENTICATED')),
  403: errorEnvelope(baseError('FORBIDDEN')),
} as const;

export const priceBookContract = c.router({
  active: {
    method: 'GET',
    path: '/price-book/active',
    summary: 'The rate card in force: the newest version, or the platform default before the first',
    responses: { 200: priceBookActiveSchema, ...guarded },
  },
  versions: {
    method: 'GET',
    path: '/price-book/versions',
    query: paginationQuerySchema,
    summary: 'Every price-book version, newest first, with the one in force marked',
    responses: { 200: paginated(priceBookVersionSummarySchema), ...guarded },
  },
  version: {
    method: 'GET',
    path: '/price-book/versions/:id',
    pathParams: z.object({ id: uuidSchema }),
    summary: 'One price-book version and its rates, read-only',
    responses: {
      200: priceBookVersionSchema,
      ...guarded,
      404: errorEnvelope(baseError('NOT_FOUND')),
    },
  },
  publish: {
    method: 'POST',
    path: '/price-book/versions',
    headers: createHeadersSchema,
    body: priceBookPublishSchema,
    summary:
      'Publish a new price-book version — the whole rate set, its default margin and a note; it is now the one in force',
    responses: {
      201: priceBookVersionHeadSchema,
      ...guarded,
      422: errorEnvelope(z.enum([IDEMPOTENCY_KEY_REUSED])),
    },
  },
});
