import {
  CATALOG_SORTS,
  CATALOG_SOURCES,
  COMPONENT_KINDS,
  PANEL_TECHNOLOGIES,
} from '@heliogrid/domain';
import { z } from 'zod';
import { paginationQuerySchema } from './common';

/**
 * The catalog list's query (`MS4-10`, `M01-38`, `SCR-M01-15`): what the picker and Catalog settings
 * narrow and order the resolved list by, and the two vocabularies it narrows by. Split from
 * `catalog.ts` by subarea; `catalog.ts` re-exports each.
 */

/** What a catalog item is (`M01-45`). */
export const componentKindSchema = z.enum(COMPONENT_KINDS);
export type ComponentKind = z.infer<typeof componentKindSchema>;

/** Which tier supplied a resolved value (`MS4-07`'s second axis). */
export const catalogSourceSchema = z.enum(CATALOG_SOURCES);
export const catalogItemSourceSchema = catalogSourceSchema.extract(['platform_item', 'own_item']);
const flagSchema = z.enum(['true', 'false']).transform((flag) => flag === 'true');

/** The list's orders (`SCR-M01-15`); `preferred` is the default. */
export const catalogSortSchema = z.enum(CATALOG_SORTS);

const KIND_LIST = new RegExp(`^(${COMPONENT_KINDS.join('|')})(,(${COMPONENT_KINDS.join('|')}))*$`);

/** A comma list of kinds; the pattern admits only members, so every part parses. */
const kindsSchema = z
  .string()
  .regex(KIND_LIST)
  .transform((list) =>
    [...new Set(list.split(','))].flatMap((part) => {
      const kind = componentKindSchema.safeParse(part);
      return kind.success ? [kind.data] : [];
    }),
  );

/**
 * The picker's and Catalog settings' list (`MS4-10`, `M01-38`): `schemes` is a comma list and
 * keeps items holding every one; a watt or technology filter keeps panels only; `archived`
 * lists the archived alone. `kinds` keeps any kind listed and wins over `kind`; `includeHidden`
 * keeps the items a tenant hid from its pickers, which only Catalog settings lists; `changed` keeps
 * only what the tenant changed — its own SKUs, and platform items its override sets something on.
 */
export const catalogItemsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  source: catalogItemSourceSchema.optional(),
  kind: componentKindSchema.optional(),
  kinds: kindsSchema.optional(),
  includeHidden: flagSchema.optional(),
  changed: flagSchema.optional(),
  sort: catalogSortSchema.optional(),
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
