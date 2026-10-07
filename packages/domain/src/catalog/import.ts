import { FILE_MAX_BYTES } from '../files/rules';

/**
 * The spreadsheet import's closed sets (`M01-41`). Contracts derives its `z.enum`s from these and
 * the database mirrors them as pgEnums when the job's table lands, so a member added here is added
 * to both in the same change.
 */

/**
 * Where a job is in its life. A job is read, mapped, matched into a preview, then run; a file that
 * cannot be read ends it at `unreadable`, and the person replaces the file. The whole machine is
 * declared at once, so a later phase adds no enum value to a stored column.
 */
export const CATALOG_IMPORT_STATES = [
  'reading',
  'unreadable',
  'mapped',
  'matching',
  'previewed',
  'running',
  'completed',
] as const;
export type CatalogImportState = (typeof CATALOG_IMPORT_STATES)[number];

/** The wizard's three doors (`M01-41`): one wizard, reached from onboarding, settings or a flow. */
export const CATALOG_IMPORT_ENTRY_POINTS = ['onboarding', 'settings', 'in_flow'] as const;
export type CatalogImportEntryPoint = (typeof CATALOG_IMPORT_ENTRY_POINTS)[number];

/**
 * Why a file was not read — each one step 1's error, answered by choosing another file
 * (`SCR-M01-17` decision 27). `not_read` is a store or database that stayed down past every retry:
 * the file may be fine, and choosing it again reads it again.
 */
export const CATALOG_IMPORT_UNREADABLE_REASONS = [
  'cannot_open',
  'too_large_unpacked',
  'no_rows',
  'not_read',
] as const;
export type CatalogImportUnreadableReason = (typeof CATALOG_IMPORT_UNREADABLE_REASONS)[number];

/** How many times its stored size a workbook may unpack to (`T-M01-030c` decision 2). */
const UNPACKED_TIMES_STORED = 10;

/**
 * The most a workbook may unpack to. An `.xlsx` is a zip, so a 2 MB upload can unpack to hundreds
 * of megabytes inside the api that reads it; ten times the upload ceiling is the owner's bound.
 * Raise it and a packed file can take the serving api's memory.
 */
export const CATALOG_IMPORT_UNPACKED_LIMIT_BYTES = FILE_MAX_BYTES * UNPACKED_TIMES_STORED;

/** The longest file name a job keeps: the contract's bound and the column's CHECK, one number. */
export const CATALOG_IMPORT_FILE_NAME_MAX = 255;

/**
 * One sheet of a read file, as the file holds it: its name, how many rows and columns it fills, and
 * its first `HEADER_ROW_SCAN` rows as text — what step 1 places the header row on and step 2 guesses
 * the columns from, on the device (`T-M01-030c` decision 3). Counted, never guessed.
 */
export interface CatalogImportSheet {
  readonly name: string;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly topRows: readonly (readonly string[])[];
}

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

/** How many rows the pass judged each way, as a store counts them by outcome. */
export type CatalogImportOutcomeCounts = Readonly<Partial<Record<CatalogImportRowOutcome, number>>>;

/** The preview's figures from the rows counted by outcome; an outcome absent counts nothing. */
export function countImportMatches(byOutcome: CatalogImportOutcomeCounts): CatalogImportCounts {
  const of = (...wanted: readonly CatalogImportRowOutcome[]) =>
    wanted.reduce((sum, outcome) => sum + (byOutcome[outcome] ?? 0), 0);
  return {
    rows: of(...CATALOG_IMPORT_ROW_OUTCOMES),
    matched: of('price_override', 'own_item_price'),
    newItems: of('new_item'),
    needsAttention: of('needs_attention'),
    leftOut: of('left_out'),
  };
}

/** Where a job takes a new mapping: once read, and until it runs (`T-M01-030d` decision 3). */
export const CATALOG_IMPORT_MAPPABLE_STATES = ['mapped', 'matching', 'previewed'] as const;

export function takesImportMapping(state: CatalogImportState): boolean {
  return CATALOG_IMPORT_MAPPABLE_STATES.some((mappable) => mappable === state);
}

/** Whether the matching pass has left rows to show: previewed, and every state after it. */
export function hasImportPreview(state: CatalogImportState): boolean {
  return state === 'previewed' || state === 'running' || state === 'completed';
}
