import { LEAD_SOURCES } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { catalogItemSourceSchema, componentKindSchema } from './catalog-query';
import { extensibleEnum, phoneE164Schema, uuidSchema } from './common';
import { leadLifecycleStateSchema, leadStageSchema } from './crm/vocabulary';
import { unauthenticatedEnvelope } from './error';

const c = initContract();

/*
 * Global search (`F6-24`, `T-FPLAT-020`, `SCR-SHELL-02`): one read over leads, customers, people
 * and catalog items, each group scoped as its own domain is and never billing-gated. A number
 * normalises and an exact match ranks first, then name and city prefixes. Each later module adds
 * its group as a new property (Law 9).
 */

/** What was typed; `limit` is how many rows each group returns first. */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

/** A group: how many records match in all, and the first of them. */
function groupOf<T extends z.ZodTypeAny>(row: T) {
  return z.object({ total: z.number().int().nonnegative(), items: z.array(row) });
}

/** A lead row carries its R9 state — a junk lead is found here and nowhere else (`M02-55`). */
export const searchLeadSchema = z.object({
  id: uuidSchema,
  name: z.string().nullable(),
  phoneE164: phoneE164Schema,
  city: z.string().nullable(),
  stage: leadStageSchema,
  state: leadLifecycleStateSchema.nullable(),
  source: extensibleEnum(LEAD_SOURCES),
  ownerName: z.string().nullable(),
});

export const searchCustomerSchema = z.object({
  id: uuidSchema,
  name: z.string().nullable(),
  phoneE164: phoneE164Schema,
  city: z.string().nullable(),
});

/** A team member, by name only — the roster's phones are not every searcher's to read. */
export const searchPersonSchema = z.object({ userId: uuidSchema, name: z.string() });

export const searchCatalogItemSchema = z.object({
  id: uuidSchema,
  source: catalogItemSourceSchema,
  kind: componentKindSchema,
  brand: z.string(),
  model: z.string(),
});

export const searchResultsSchema = z.object({
  leads: groupOf(searchLeadSchema),
  customers: groupOf(searchCustomerSchema),
  people: groupOf(searchPersonSchema),
  catalog: groupOf(searchCatalogItemSchema),
});
export type SearchResults = z.infer<typeof searchResultsSchema>;

export const searchContract = c.router({
  search: {
    method: 'GET',
    path: '/search',
    query: searchQuerySchema,
    summary:
      'Find any lead, customer, team member or catalog item by name, number or city — only what the searcher may open, in every billing state',
    responses: { 200: searchResultsSchema, 401: unauthenticatedEnvelope },
  },
});
