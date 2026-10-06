import { catalogSpecSchema } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  catalogCertificationSchema,
  catalogItemSourceSchema,
  componentKindSchema,
  releaseChangeKindSchema,
  resolvedRateSchema,
} from './catalog';
import {
  createHeadersSchema,
  paginated,
  paginationQuerySchema,
  percentSchema,
  uuidSchema,
} from './common';
import { baseError, errorEnvelope, IDEMPOTENCY_KEY_REUSED } from './error';

const c = initContract();

/**
 * The catalog's releases (`M01-43`, `T-M01-027` part c): a labelled, append-only publish of the
 * tenant's catalog changes, each line a before-and-after (`SCR-M01-15` decision 4). A release is
 * read by whoever reads prices — every side carries the rate in force on its publish day.
 */

/**
 * The refusals only the publish raises, each worded in `packages/i18n` (a `Record` over this
 * enum): the label is already one of this tenant's releases; nothing changed since the last one.
 */
export const catalogReleaseErrorCodes = ['CATALOG_LABEL_TAKEN', 'CATALOG_NOTHING_CHANGED'] as const;
export const catalogReleaseErrorCodeSchema = z.enum(catalogReleaseErrorCodes);
export type CatalogReleaseErrorCode = z.infer<typeof catalogReleaseErrorCodeSchema>;

const snapshotRateSchema = resolvedRateSchema.omit({ source: true }).nullable();

/** One side of a line: the item as stored on the publish day — never a resolved view. */
export const catalogReleaseSideSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('own_item'),
    brand: z.string(),
    model: z.string(),
    spec: catalogSpecSchema,
    certifications: z.array(catalogCertificationSchema),
    preferred: z.boolean(),
    archived: z.boolean(),
    rate: snapshotRateSchema,
  }),
  z.object({
    kind: z.literal('override'),
    taxPct: percentSchema.nullable(),
    hidden: z.boolean(),
    preferred: z.boolean(),
    rate: snapshotRateSchema,
  }),
]);
export type CatalogReleaseSideWire = z.infer<typeof catalogReleaseSideSchema>;

/** One changed item: named as it is now, its two sides as they were (`before` null when added). */
export const catalogReleaseLineSchema = z.object({
  item: z.object({
    id: uuidSchema,
    source: catalogItemSourceSchema,
    kind: componentKindSchema,
    brand: z.string(),
    model: z.string(),
  }),
  changeKind: releaseChangeKindSchema,
  before: catalogReleaseSideSchema.nullable(),
  after: catalogReleaseSideSchema,
});
export type CatalogReleaseLineWire = z.infer<typeof catalogReleaseLineSchema>;

/** A release's head: its name and date (`M01-43`), and its lines counted by what they say. */
export const catalogReleaseSchema = z.object({
  id: uuidSchema,
  label: z.string(),
  publishedAt: z.string().datetime(),
  counts: z.object({
    added: z.number().int().nonnegative(),
    changed: z.number().int().nonnegative(),
    archived: z.number().int().nonnegative(),
  }),
});
export type CatalogReleaseWire = z.infer<typeof catalogReleaseSchema>;

export const catalogReleaseDetailSchema = z.object({
  release: catalogReleaseSchema,
  lines: paginated(catalogReleaseLineSchema),
});
export type CatalogReleaseDetailWire = z.infer<typeof catalogReleaseDetailSchema>;

export const catalogReleaseWriteSchema = z.object({ label: z.string().trim().min(1).max(80) });
export type CatalogReleaseWrite = z.infer<typeof catalogReleaseWriteSchema>;

const guarded = {
  401: errorEnvelope(baseError('UNAUTHENTICATED')),
  403: errorEnvelope(baseError('FORBIDDEN')),
} as const;

export const catalogReleasesContract = c.router({
  releases: {
    method: 'GET',
    path: '/catalog/releases',
    query: paginationQuerySchema,
    summary: 'The tenant’s catalog releases, newest first, each with its lines counted',
    responses: { 200: paginated(catalogReleaseSchema), ...guarded },
  },
  release: {
    method: 'GET',
    path: '/catalog/releases/:id',
    pathParams: z.object({ id: uuidSchema }),
    query: paginationQuerySchema,
    summary: 'One release and a page of its before-and-after lines',
    responses: {
      200: catalogReleaseDetailSchema,
      ...guarded,
      404: errorEnvelope(baseError('NOT_FOUND')),
    },
  },
  publish: {
    method: 'POST',
    path: '/catalog/releases',
    headers: createHeadersSchema,
    body: catalogReleaseWriteSchema,
    summary:
      'Publish a labelled release: one line for each own SKU or override that changed since its last line',
    responses: {
      201: catalogReleaseSchema,
      ...guarded,
      409: errorEnvelope(catalogReleaseErrorCodeSchema.extract(['CATALOG_LABEL_TAKEN'])),
      422: errorEnvelope(z.enum(['CATALOG_NOTHING_CHANGED', IDEMPOTENCY_KEY_REUSED])),
    },
  },
});
