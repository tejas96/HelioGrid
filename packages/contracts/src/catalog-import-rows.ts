import {
  CATALOG_IMPORT_ATTENTION_REASONS,
  CATALOG_IMPORT_CONFLICT_ANSWERS,
  CATALOG_IMPORT_FIELDS,
  CATALOG_IMPORT_ROW_FAILURES,
  CATALOG_IMPORT_ROW_OUTCOMES,
  CATALOG_IMPORT_ROW_RESULTS,
  type CatalogImportCounts,
  type CatalogImportRowFix,
} from '@heliogrid/domain';
import { z } from 'zod';
import { catalogItemSourceSchema, resolvedRateSchema } from './catalog';
import { amountSchema, extensibleEnum, paginationQuerySchema, uuidSchema } from './common';

/*
 * The import's rows (`T-M01-030d` … `f`): one per filled sheet row, as the preview grid pages them,
 * a fix changes them and the run's report reads them. The routes are `catalogImportContract`'s.
 */

/** Held by the pgEnum `catalog_import_row_outcome` (invariant `enum-parity`). */
export const catalogImportRowOutcomeSchema = z.enum(CATALOG_IMPORT_ROW_OUTCOMES);
/** Held by the pgEnum `catalog_import_conflict_answer` (invariant `enum-parity`). */
export const catalogImportConflictAnswerSchema = z.enum(CATALOG_IMPORT_CONFLICT_ANSWERS);
export const catalogImportFieldSchema = z.enum(CATALOG_IMPORT_FIELDS);
/** Held by the pgEnum `catalog_import_row_result` (invariant `enum-parity`). */
export const catalogImportRowResultSchema = z.enum(CATALOG_IMPORT_ROW_RESULTS);
/** Held by the pgEnum `catalog_import_row_failure` (invariant `enum-parity`). */
export const catalogImportRowFailureSchema = z.enum(CATALOG_IMPORT_ROW_FAILURES);

/** The preview's figures (`SCR-M01-17` decision 3), counted off the rows: derived, never stored. */
export const catalogImportCountsSchema = z.object({
  rows: z.number().int().nonnegative(),
  matched: z.number().int().nonnegative(),
  newItems: z.number().int().nonnegative(),
  needsAttention: z.number().int().nonnegative(),
  leftOut: z.number().int().nonnegative(),
}) satisfies z.ZodType<CatalogImportCounts>;

/** Keyed by import field (`CATALOG_IMPORT_FIELDS`), held open so a field added later still parses. */
const importCellsSchema = z.record(z.string(), z.string());

/**
 * One row of the preview grid: the cells as the file wrote them, the person's fix over them, the
 * pass's verdict, the price the file asks and the price the catalog holds now (`SCR-M01-17`
 * decision 7) — null when the cell holds no readable price, or the item no rate. Once the import
 * has run, what the run did with the row, and why when it failed (`T-M01-030f`); and the report's
 * two prices (`T-M01-030g`): on a row the run wrote, the rate in force just before its write and
 * the rate it wrote; on any other row, the rate its matched item holds now and none applied. Both
 * are null on a row not yet run; `priceBefore` is null where the item had no price, or where the
 * row names no item (`match` null — a needs-attention row stores none, `deferred.md` D129).
 */
export const catalogImportRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  cells: importCellsSchema,
  fix: importCellsSchema,
  leftOut: z.boolean(),
  answer: extensibleEnum(CATALOG_IMPORT_CONFLICT_ANSWERS).nullable(),
  outcome: extensibleEnum(CATALOG_IMPORT_ROW_OUTCOMES),
  attention: z.array(
    z.object({
      reason: extensibleEnum(CATALOG_IMPORT_ATTENTION_REASONS),
      fields: z.array(z.string()),
    }),
  ),
  match: z.object({ source: catalogItemSourceSchema, id: uuidSchema }).nullable(),
  filePrice: amountSchema.nullable(),
  catalogPrice: resolvedRateSchema.nullable(),
  result: extensibleEnum(CATALOG_IMPORT_ROW_RESULTS).nullable(),
  failure: extensibleEnum(CATALOG_IMPORT_ROW_FAILURES).nullable(),
  priceBefore: resolvedRateSchema.nullable(),
  priceApplied: resolvedRateSchema.nullable(),
});
export type CatalogImportRowWire = z.infer<typeof catalogImportRowSchema>;

export const catalogImportRowsQuerySchema = paginationQuerySchema.extend({
  outcome: catalogImportRowOutcomeSchema.optional(),
  result: catalogImportRowResultSchema.optional(),
});
export type CatalogImportRowsQuery = z.infer<typeof catalogImportRowsQuerySchema>;

/** A fix is one act on its row, so exactly one of these keys is sent. */
const ROW_FIX_ACTS = ['cells', 'leaveOut', 'answer'] as const;

/**
 * One fix to one row (`T-M01-030e` decision 1): typed cells laid over the file's, the row left
 * out or brought back, or the answer to its spec conflict — exactly one of the three. One strict
 * object rather than a union, so a refusal names the key at fault (`details[].path`).
 */
export const catalogImportRowFixSchema = z
  .object({
    cells: z.record(catalogImportFieldSchema, z.string()).optional(),
    leaveOut: z.boolean().optional(),
    answer: catalogImportConflictAnswerSchema.optional(),
  })
  .strict()
  .transform((body, context): CatalogImportRowFix => {
    const sent = ROW_FIX_ACTS.filter((act) => body[act] !== undefined);
    if (sent.length === 1 && body.cells !== undefined) return { cells: body.cells };
    if (sent.length === 1 && body.leaveOut !== undefined) return { leaveOut: body.leaveOut };
    if (sent.length === 1 && body.answer !== undefined) return { answer: body.answer };
    context.addIssue({
      code: 'custom',
      path: sent.slice(1, 2),
      message: 'A fix sends exactly one of cells, leaveOut or answer.',
    });
    return z.NEVER;
  });
export type CatalogImportRowFixWrite = z.infer<typeof catalogImportRowFixSchema>;

/**
 * What a fix changed: every row whose verdict or fix moved — the fixed row and the rows naming its
 * product — by row number, and the job's counts after it (`T-M01-030e` decision 4).
 */
export const catalogImportFixedSchema = z.object({
  rows: z.array(catalogImportRowSchema),
  counts: catalogImportCountsSchema,
});
export type CatalogImportFixedWire = z.infer<typeof catalogImportFixedSchema>;
