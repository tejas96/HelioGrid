/**
 * The spreadsheet import's closed sets (`M01-41`). Contracts derives its `z.enum`s from these and
 * the database mirrors them as pgEnums when the job's table lands, so a member added here is added
 * to both in the same change.
 */

/**
 * What the matching pass makes of one row. A match on a platform item becomes a price override and
 * never a second copy of it; a match on one of the tenant's own SKUs becomes a dated rate on that
 * SKU, which is why a file imported twice makes no second SKU (§M01.4 edge cases).
 */
export const CATALOG_IMPORT_ROW_OUTCOMES = [
  'price_override',
  'own_item_price',
  'new_item',
  'needs_attention',
  'left_out',
] as const;
export type CatalogImportRowOutcome = (typeof CATALOG_IMPORT_ROW_OUTCOMES)[number];

/** Why a row needs attention — each one a question the preview grid answers in place. */
export const CATALOG_IMPORT_ATTENTION_REASONS = [
  'brand_or_model_missing',
  'kind_missing',
  'price_missing',
  'price_unreadable',
  'price_below_zero',
  'price_finer_than_minor_unit',
  'spec_missing',
  'spec_invalid',
  'spec_conflict',
  'several_matches',
  'repeated_in_file',
] as const;
export type CatalogImportAttentionReason = (typeof CATALOG_IMPORT_ATTENTION_REASONS)[number];

/**
 * The two answers to a spec conflict on a match (`SCR-M01-17` decision 31): keep the catalog's
 * spec and set only the price, or import the row as an own SKU. There is no third answer that
 * edits a platform spec.
 */
export const CATALOG_IMPORT_CONFLICT_ANSWERS = ['keep_catalog_spec', 'import_as_own_item'] as const;
export type CatalogImportConflictAnswer = (typeof CATALOG_IMPORT_CONFLICT_ANSWERS)[number];

/** The preview's figures: `N rows · M match · K new · E need attention`, and the rows left out. */
export interface CatalogImportCounts {
  readonly rows: number;
  readonly matched: number;
  readonly newItems: number;
  readonly needsAttention: number;
  readonly leftOut: number;
}

export function countImportMatches(
  outcomes: readonly CatalogImportRowOutcome[],
): CatalogImportCounts {
  const of = (...wanted: CatalogImportRowOutcome[]) =>
    outcomes.filter((outcome) => wanted.includes(outcome)).length;
  return {
    rows: outcomes.length,
    matched: of('price_override', 'own_item_price'),
    newItems: of('new_item'),
    needsAttention: of('needs_attention'),
    leftOut: of('left_out'),
  };
}
