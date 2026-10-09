import {
  CATALOG_AVAILABILITY,
  CATALOG_PROVENANCE_LABELS,
  CATALOG_SOURCES,
  COMPONENT_KINDS,
  catalogSpecSchema,
  PANEL_TECHNOLOGIES,
  RELEASE_CHANGE_KINDS,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  amountSchema,
  createHeadersSchema,
  currencyCodeSchema,
  paginated,
  paginationQuerySchema,
  percentSchema,
  uuidSchema,
} from './common';
import { baseError, errorEnvelope, IDEMPOTENCY_KEY_REUSED } from './error';
import { calendarDateSchema } from './tenant-settings';

const c = initContract();

/**
 * The catalog (`T-M01-027`): its closed sets, derived from domain's tuples and mirrored as
 * pgEnums (invariant `enum-parity`); the market-scoped read through `resolveCatalogItem`; and the
 * tenant's writes — own SKUs, the sparse override, the dated rate ledger. The releases are
 * `catalog-releases.ts`.
 */

/** What a catalog item is (`M01-45`). */
export const componentKindSchema = z.enum(COMPONENT_KINDS);
export type ComponentKind = z.infer<typeof componentKindSchema>;

/** Where an item's specs came from (`M01-35`) — never a statement about a price. */
export const catalogProvenanceSchema = z.enum(CATALOG_PROVENANCE_LABELS);
export type CatalogProvenanceLabel = z.infer<typeof catalogProvenanceSchema>;

/** Whether a platform item can be bought now (`S5.wrong.4`). */
export const catalogAvailabilitySchema = z.enum(CATALOG_AVAILABILITY);
export type CatalogAvailability = z.infer<typeof catalogAvailabilitySchema>;

/** What one release line says about one item (`M01-43`). */
export const releaseChangeKindSchema = z.enum(RELEASE_CHANGE_KINDS);
export type ReleaseChangeKind = z.infer<typeof releaseChangeKindSchema>;

/** Which tier supplied a resolved value (`MS4-07`'s second axis). */
const catalogSourceSchema = z.enum(CATALOG_SOURCES);
export const catalogItemSourceSchema = catalogSourceSchema.extract(['platform_item', 'own_item']);

/** One scheme-keyed claim (`M01-34`): a `list_reference` scheme carries its reference, a flag none. */
export const catalogCertificationSchema = z.object({
  scheme: z.string().trim().min(1).max(40),
  reference: z.string().trim().min(1).max(200).nullable(),
});

/**
 * A rate as the reader is shown it (`MS4-07`): the amount in the tenant's currency and the date
 * of the ledger entry in force.
 */
export const resolvedRateSchema = z.object({
  source: catalogSourceSchema.extract(['override', 'own_item']),
  amount: amountSchema,
  currencyCode: currencyCodeSchema,
  effectiveOn: calendarDateSchema,
});

const resolvedTaxSchema = z.object({
  source: catalogSourceSchema.extract(['override', 'pack']),
  pct: percentSchema,
});

/**
 * `ResolvedCatalogItem` on the wire (Law 11). `rate` and `tax` are ABSENT for a reader without
 * `onboarding.manage_catalog` in any form, and `null` when nothing is in force — so "no price" and
 * "not yours to see" never read alike (ruling 1A, §M01.4).
 */
export const resolvedCatalogItemSchema = z.object({
  id: uuidSchema,
  source: catalogItemSourceSchema,
  brand: z.string(),
  model: z.string(),
  spec: catalogSpecSchema,
  provenance: catalogProvenanceSchema,
  availability: catalogAvailabilitySchema.nullable(),
  certifications: z.array(catalogCertificationSchema),
  badges: z.array(z.string()),
  tax: resolvedTaxSchema.nullable().optional(),
  rate: resolvedRateSchema.nullable().optional(),
  hidden: z.boolean(),
  preferred: z.boolean(),
  archived: z.boolean(),
});
export type ResolvedCatalogItemWire = z.infer<typeof resolvedCatalogItemSchema>;

/** One item read alone: the drafts still naming it, which the archive warning shows. */
export const catalogItemSchema = resolvedCatalogItemSchema.extend({
  openDraftCount: z.number().int().nonnegative(),
});
export type CatalogItemWire = z.infer<typeof catalogItemSchema>;

const flagSchema = z.enum(['true', 'false']).transform((flag) => flag === 'true');

/**
 * The picker's and Catalog settings' list (`MS4-10`, `M01-38`): `schemes` is a comma list and
 * keeps items holding every one; a watt or technology filter keeps panels only; `archived`
 * lists the archived alone.
 */
export const catalogItemsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  source: catalogItemSourceSchema.optional(),
  kind: componentKindSchema.optional(),
  wattMin: z.coerce.number().positive().optional(),
  wattMax: z.coerce.number().positive().optional(),
  technology: z.enum(PANEL_TECHNOLOGIES).optional(),
  schemes: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,40}(,[A-Za-z0-9_-]{1,40}){0,9}$/)
    .transform((list) => [...new Set(list.split(','))])
    .optional(),
  preferred: flagSchema.optional(),
  archived: flagSchema.optional(),
});
export type CatalogItemsQuery = z.infer<typeof catalogItemsQuerySchema>;

/** A price of one unit in the tenant's currency; zero is a price, a negative one is not. */
export const priceSchema = amountSchema.refine(
  (amount) => !amount.startsWith('-'),
  'a price is ≥ 0',
);

/** A dated entry (`M01-44`): no date means today on the tenant's clock, never a day before it. */
export const rateWriteSchema = z.object({
  amount: priceSchema,
  effectiveOn: calendarDateSchema.optional(),
});
export type RateWrite = z.infer<typeof rateWriteSchema>;

/** The single form (`M01-39`): the spec is its kind's envelope, held by its gates (`MS4-13`). */
export const ownCatalogItemWriteSchema = z.object({
  brand: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(120),
  spec: catalogSpecSchema,
  certifications: z.array(catalogCertificationSchema).max(10),
  preferred: z.boolean(),
});
export type OwnCatalogItemWrite = z.infer<typeof ownCatalogItemWriteSchema>;

export const ownCatalogItemCreateSchema = ownCatalogItemWriteSchema.extend({
  rate: rateWriteSchema.optional(),
});
export type OwnCatalogItemCreate = z.infer<typeof ownCatalogItemCreateSchema>;

/** Only what is sent changes; `taxPct: null` falls back to the market's rate (`M01-37`). */
export const catalogOverrideWriteSchema = z.object({
  taxPct: percentSchema.nullable().optional(),
  hidden: z.boolean().optional(),
  preferred: z.boolean().optional(),
  rate: rateWriteSchema.optional(),
});
export type CatalogOverrideWrite = z.infer<typeof catalogOverrideWriteSchema>;

/** `amount: null` clears the rate from that date: a dated absence, the history kept. */
export const rateEntryWriteSchema = z.object({
  amount: priceSchema.nullable(),
  effectiveOn: calendarDateSchema.optional(),
});
export type RateEntryWrite = z.infer<typeof rateEntryWriteSchema>;

export const rateEntrySchema = z.object({
  amount: amountSchema.nullable(),
  currencyCode: currencyCodeSchema,
  effectiveOn: calendarDateSchema,
  recordedAt: z.string().datetime(),
});
export type RateEntryWire = z.infer<typeof rateEntrySchema>;

const unauthenticated = errorEnvelope(baseError('UNAUTHENTICATED'));
const notFound = errorEnvelope(baseError('NOT_FOUND'));
const conflict = errorEnvelope(baseError('CONFLICT'));
const ruleBroken = errorEnvelope(baseError('DOMAIN_RULE_VIOLATION'));
const ruleBrokenOrKeyReused = errorEnvelope(
  z.enum([baseError('DOMAIN_RULE_VIOLATION').value, IDEMPOTENCY_KEY_REUSED]),
);

const guarded = { 401: unauthenticated } as const;
const itemParams = z.object({ id: uuidSchema });

export const catalogContract = c.router({
  items: {
    method: 'GET',
    path: '/catalog/items',
    query: catalogItemsQuerySchema,
    summary:
      'The resolved catalog of the tenant’s market plus its own SKUs — preferred first, hidden ones absent, archived ones only under their filter',
    responses: { 200: paginated(resolvedCatalogItemSchema), ...guarded },
  },
  item: {
    method: 'GET',
    path: '/catalog/items/:id',
    pathParams: itemParams,
    summary: 'One resolved item, hidden or archived, with the drafts still naming it',
    responses: { 200: catalogItemSchema, ...guarded, 404: notFound },
  },
  createItem: {
    method: 'POST',
    path: '/catalog/items',
    headers: createHeadersSchema,
    body: ownCatalogItemCreateSchema,
    summary:
      'Add an own SKU from the single form — nothing copied from any platform item; a first rate may ride with it for the outright manage grant, and from anyone else it is 403',
    responses: {
      201: catalogItemSchema,
      ...guarded,
      /** A claim the market does not hold, or a rate dated before today — `details[].path` says which. */
      422: ruleBrokenOrKeyReused,
    },
  },
  saveItem: {
    method: 'PUT',
    path: '/catalog/items/:id',
    pathParams: itemParams,
    body: ownCatalogItemWriteSchema,
    summary: 'Replace an own SKU’s brand, model, specs, claims and preference',
    responses: {
      200: catalogItemSchema,
      ...guarded,
      404: notFound,
      /** A platform item: read-only to every tenant. */
      409: conflict,
      422: ruleBroken,
    },
  },
  archiveItem: {
    method: 'POST',
    path: '/catalog/items/:id/archive',
    pathParams: itemParams,
    body: c.noBody(),
    summary: 'Archive an own SKU — it leaves pickers, and every reference still resolves',
    responses: { 200: catalogItemSchema, ...guarded, 404: notFound, 409: conflict },
  },
  unarchiveItem: {
    method: 'POST',
    path: '/catalog/items/:id/unarchive',
    pathParams: itemParams,
    body: c.noBody(),
    summary: 'Bring an archived own SKU back to the pickers',
    responses: { 200: catalogItemSchema, ...guarded, 404: notFound, 409: conflict },
  },
  saveOverride: {
    method: 'PUT',
    path: '/catalog/items/:id/override',
    pathParams: itemParams,
    headers: createHeadersSchema,
    body: catalogOverrideWriteSchema,
    summary:
      'Set the tenant’s sparse override on a platform item — tax, hidden, preferred; a rate appends a dated entry, and the retry key guards that entry alone',
    responses: {
      200: catalogItemSchema,
      ...guarded,
      404: notFound,
      /** An own SKU: it has no override, its own fields are edited instead. */
      409: conflict,
      422: ruleBrokenOrKeyReused,
    },
  },
  clearOverride: {
    method: 'DELETE',
    path: '/catalog/items/:id/override',
    pathParams: itemParams,
    body: c.noBody(),
    summary: 'Clear the override — every field falls through again; the rate history stays',
    responses: { 200: catalogItemSchema, ...guarded, 404: notFound, 409: conflict },
  },
  recordRate: {
    method: 'POST',
    path: '/catalog/items/:id/rate-entries',
    pathParams: itemParams,
    headers: createHeadersSchema,
    body: rateEntryWriteSchema,
    summary:
      'Append a dated rate entry on an own SKU or a platform item’s override — never an edit',
    responses: { 201: catalogItemSchema, ...guarded, 404: notFound, 422: ruleBrokenOrKeyReused },
  },
  rateEntries: {
    method: 'GET',
    path: '/catalog/items/:id/rate-entries',
    pathParams: itemParams,
    query: paginationQuerySchema,
    summary: 'The dated rate history, newest first',
    responses: { 200: paginated(rateEntrySchema), ...guarded, 404: notFound },
  },
});
