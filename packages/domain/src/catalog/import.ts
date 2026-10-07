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

/**
 * The largest sheet row number a job stores: the most its `row_number integer` column holds. A
 * fix naming a larger row is refused before it reaches the column, which would fail it.
 */
export const CATALOG_IMPORT_ROW_NUMBER_MAX = 2_147_483_647;

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

/**
 * What the run did with one row (`SCR-M01-17` pass 3: a preview projects, a report records). A row
 * the preview did not settle is left out and stays unchanged in the catalog; a row the catalog
 * could not take is failed with its reason (`T-M01-030f` decisions 4 and 6).
 */
export const CATALOG_IMPORT_ROW_RESULTS = [
  'price_applied',
  'product_created',
  'left_out',
  'failed',
] as const;
export type CatalogImportRowResult = (typeof CATALOG_IMPORT_ROW_RESULTS)[number];

/**
 * Why a row the preview settled was not written: judged again at the write, it needed attention —
 * its product changed in the catalog since the preview — or the run could not reach the catalog
 * past every retry, and the row was never tried.
 */
export const CATALOG_IMPORT_ROW_FAILURES = ['changed_since_preview', 'not_applied'] as const;
export type CatalogImportRowFailure = (typeof CATALOG_IMPORT_ROW_FAILURES)[number];

/** The outcomes a run writes into the catalog; a row judged any other way is left out. */
export const CATALOG_IMPORT_WRITTEN_OUTCOMES = [
  'price_override',
  'own_item_price',
  'new_item',
] as const satisfies readonly CatalogImportRowOutcome[];

/**
 * Rows a run writes per step call and per transaction: the catalog lock is held for one batch,
 * never a whole sheet, and a 2 MB sheet's tens of thousands of rows stay inside the step's one-minute
 * timeout call by call. Raise it and one batch can outlast the timeout or hold the lock longer.
 */
export const CATALOG_IMPORT_RUN_BATCH_ROWS = 100;

/** A run starts from the preview only; a fix and a new mapping end there (`T-M01-030f` decision 8). */
export function takesImportRun(state: CatalogImportState): boolean {
  return state === 'previewed';
}

/** Whether the job has been run: it is running, or has finished and keeps its results. */
export function hasImportRun(state: CatalogImportState): boolean {
  return state === 'running' || state === 'completed';
}

/** A job's rows counted by result; `pending` counts the rows the run has still to write. */
export type CatalogImportResultCounts = Readonly<
  Partial<Record<CatalogImportRowResult | 'pending', number>>
>;

/** The run's counted progress (`SCR-M01-17` pass 3, "218 of 405"): rows written of rows to write. */
export interface CatalogImportRunProgress {
  readonly done: number;
  readonly total: number;
}

/** Read off the rows, never stored: every row with a result counts, except a row left out. */
export function importRunProgress(byResult: CatalogImportResultCounts): CatalogImportRunProgress {
  const done =
    (byResult.price_applied ?? 0) + (byResult.product_created ?? 0) + (byResult.failed ?? 0);
  return { done, total: done + (byResult.pending ?? 0) };
}

/** The report's figures: what the run did with every row of the sheet. */
export interface CatalogImportResults {
  readonly priceApplied: number;
  readonly productCreated: number;
  readonly leftOut: number;
  readonly failed: number;
}

export function countImportResults(byResult: CatalogImportResultCounts): CatalogImportResults {
  return {
    priceApplied: byResult.price_applied ?? 0,
    productCreated: byResult.product_created ?? 0,
    leftOut: byResult.left_out ?? 0,
    failed: byResult.failed ?? 0,
  };
}
