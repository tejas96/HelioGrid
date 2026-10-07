import {
  CATALOG_IMPORT_ATTENTION_REASONS,
  CATALOG_IMPORT_CONFLICT_ANSWERS,
  CATALOG_IMPORT_ENTRY_POINTS,
  CATALOG_IMPORT_FIELDS,
  CATALOG_IMPORT_FILE_NAME_MAX,
  CATALOG_IMPORT_ROW_NUMBER_MAX,
  CATALOG_IMPORT_ROW_OUTCOMES,
  CATALOG_IMPORT_STATES,
  CATALOG_IMPORT_UNREADABLE_REASONS,
  type CatalogImportCounts,
  type CatalogImportMapping,
  type CatalogImportRowFix,
  type CatalogImportSheet,
  FILE_CONTENT_TYPES,
  importColumnsProblem,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { catalogItemSourceSchema, resolvedRateSchema } from './catalog';
import {
  amountSchema,
  createHeadersSchema,
  extensibleEnum,
  paginated,
  paginationQuerySchema,
  uuidSchema,
} from './common';
import { baseError, errorEnvelope, IDEMPOTENCY_KEY_REUSED, unauthenticatedEnvelope } from './error';
import { fileErrorCodeSchema } from './file';

const c = initContract();

/**
 * The spreadsheet import (`M01-41`, `T-M01-030`): a stored price list becomes a job, read in the
 * background, that the wizard (`SCR-M01-17`) maps, previews and runs. Every route is the catalog's
 * manage grant held outright — an import writes prices, so Finance's limited cell is refused.
 */

/** Held by the pgEnum `catalog_import_status` (invariant `enum-parity`). */
export const catalogImportStateSchema = z.enum(CATALOG_IMPORT_STATES);
/** Held by the pgEnum `catalog_import_entry_point` (invariant `enum-parity`). */
export const catalogImportEntryPointSchema = z.enum(CATALOG_IMPORT_ENTRY_POINTS);
/** Held by the pgEnum `catalog_import_unreadable_reason` (invariant `enum-parity`). */
export const catalogImportUnreadableReasonSchema = z.enum(CATALOG_IMPORT_UNREADABLE_REASONS);
/** Held by the pgEnum `catalog_import_row_outcome` (invariant `enum-parity`). */
export const catalogImportRowOutcomeSchema = z.enum(CATALOG_IMPORT_ROW_OUTCOMES);
/** Held by the pgEnum `catalog_import_conflict_answer` (invariant `enum-parity`). */
export const catalogImportConflictAnswerSchema = z.enum(CATALOG_IMPORT_CONFLICT_ANSWERS);
export const catalogImportFieldSchema = z.enum(CATALOG_IMPORT_FIELDS);

/**
 * Start an import from a stored `catalog` file. The name and the saved date are the device
 * picker's: the store keeps neither, and the wizard names the file by them (`T-M01-030c` decision 8).
 */
export const catalogImportStartSchema = z.object({
  fileId: uuidSchema,
  entryPoint: catalogImportEntryPointSchema,
  fileName: z.string().trim().min(1).max(CATALOG_IMPORT_FILE_NAME_MAX),
  savedAt: z.string().datetime().nullable(),
});
export type CatalogImportStart = z.infer<typeof catalogImportStartSchema>;

/** One sheet as the file holds it; the device guesses its header row and columns from `topRows`. */
export const catalogImportSheetSchema = z.object({
  name: z.string(),
  rowCount: z.number().int().nonnegative(),
  columnCount: z.number().int().nonnegative(),
  /** A row ends at its last filled cell; a cell past its end is blank. */
  topRows: z.array(z.array(z.string())),
}) satisfies z.ZodType<CatalogImportSheet>;
export type CatalogImportSheetWire = z.infer<typeof catalogImportSheetSchema>;

/** Where the mapping points: the sheet, its header row, and the field each column fills. */
const mappingShape = {
  sheet: z.number().int().nonnegative(),
  headerRow: z.number().int().nonnegative(),
};

/**
 * The mapping step 2 confirms (`T-M01-030d` decision 1). Brand, model and rate placed once each and
 * no field twice is the schema's (400); whether it fits the job's sheets is the service's (422) —
 * both are domain's rule, which the wizard holds its confirm to.
 */
export const catalogImportMappingSchema = z
  .object({ ...mappingShape, columns: z.array(catalogImportFieldSchema.nullable()) })
  .superRefine((mapping, context) => {
    const problem = importColumnsProblem(mapping.columns);
    if (problem !== null) context.addIssue({ code: 'custom', path: ['columns'], message: problem });
  }) satisfies z.ZodType<CatalogImportMapping>;
export type CatalogImportMappingWrite = z.infer<typeof catalogImportMappingSchema>;

/** The mapping as a job reports it; a field added later still parses on an older client. */
const catalogImportMappingReadSchema = z.object({
  ...mappingShape,
  columns: z.array(extensibleEnum(CATALOG_IMPORT_FIELDS).nullable()),
});

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
 * decision 7) — null when the cell holds no readable price, or the item no rate.
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
});
export type CatalogImportRowWire = z.infer<typeof catalogImportRowSchema>;

export const catalogImportRowsQuerySchema = paginationQuerySchema.extend({
  outcome: catalogImportRowOutcomeSchema.optional(),
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

/** A job as the re-openable list shows it. Vocabularies are extensible: later phases add states. */
export const catalogImportSummarySchema = z.object({
  id: uuidSchema,
  status: extensibleEnum(CATALOG_IMPORT_STATES),
  entryPoint: extensibleEnum(CATALOG_IMPORT_ENTRY_POINTS),
  fileName: z.string(),
  savedAt: z.string().datetime().nullable(),
  startedBy: uuidSchema,
  createdAt: z.string().datetime(),
});
export type CatalogImportSummaryWire = z.infer<typeof catalogImportSummarySchema>;

/**
 * One job, the read the wizard polls. `sheets` is null until the file is read; `unreadableReason`
 * is set exactly when the job is `unreadable`.
 */
export const catalogImportSchema = catalogImportSummarySchema.extend({
  unreadableReason: extensibleEnum(CATALOG_IMPORT_UNREADABLE_REASONS).nullable(),
  file: z.object({
    id: uuidSchema,
    contentType: extensibleEnum(FILE_CONTENT_TYPES),
    byteSize: z.number().int().positive(),
  }),
  sheets: z.array(catalogImportSheetSchema).nullable(),
  /** Null until the first mapping is confirmed. */
  mapping: catalogImportMappingReadSchema.nullable(),
  /** Null until the matching pass has previewed the rows. */
  counts: catalogImportCountsSchema.nullable(),
});
export type CatalogImportWire = z.infer<typeof catalogImportSchema>;

const guarded = {
  401: unauthenticatedEnvelope,
  403: errorEnvelope(baseError('FORBIDDEN')),
} as const;
const notFound = errorEnvelope(baseError('NOT_FOUND'));
/** The job is not where the act can happen — mapping a file not yet read, paging rows not matched. */
const wrongState = errorEnvelope(baseError('CONFLICT'));

export const catalogImportContract = c.router({
  start: {
    method: 'POST',
    path: '/catalog/imports',
    headers: createHeadersSchema,
    body: catalogImportStartSchema,
    summary:
      'Start an import from a stored price list — the file is read in the background and the job polled',
    responses: {
      201: catalogImportSchema,
      ...guarded,
      /** No such `catalog` file in this company. */
      404: notFound,
      409: errorEnvelope(fileErrorCodeSchema.extract(['FILE_NOT_UPLOADED'])),
      422: errorEnvelope(z.enum([IDEMPOTENCY_KEY_REUSED])),
    },
  },
  imports: {
    method: 'GET',
    path: '/catalog/imports',
    query: paginationQuerySchema,
    summary: 'This company’s imports, newest first — the re-openable reports',
    responses: { 200: paginated(catalogImportSummarySchema), ...guarded },
  },
  import: {
    method: 'GET',
    path: '/catalog/imports/:id',
    pathParams: z.object({ id: uuidSchema }),
    summary: 'One import: where it is, and the sheets its file holds once read',
    responses: { 200: catalogImportSchema, ...guarded, 404: notFound },
  },
  map: {
    method: 'PUT',
    path: '/catalog/imports/:id/mapping',
    pathParams: z.object({ id: uuidSchema }),
    body: catalogImportMappingSchema,
    summary:
      'Confirm the sheet, the header row and the columns — the matching pass runs in the background; a new mapping supersedes a pass still running',
    responses: {
      200: catalogImportSchema,
      ...guarded,
      404: notFound,
      /** The job is reading, unreadable, running or completed. */
      409: wrongState,
      /** The mapping does not fit the sheets the file holds — `details[].issue` says how. */
      422: errorEnvelope(baseError('DOMAIN_RULE_VIOLATION')),
    },
  },
  rows: {
    method: 'GET',
    path: '/catalog/imports/:id/rows',
    pathParams: z.object({ id: uuidSchema }),
    query: catalogImportRowsQuerySchema,
    summary: 'A page of the preview grid by sheet row number, narrowed to one outcome when asked',
    responses: {
      200: paginated(catalogImportRowSchema),
      ...guarded,
      404: notFound,
      /** The matching pass has not previewed the rows. */
      409: wrongState,
    },
  },
  fix: {
    method: 'PUT',
    path: '/catalog/imports/:id/rows/:rowNumber',
    pathParams: z.object({
      id: uuidSchema,
      rowNumber: z.coerce.number().int().positive().max(CATALOG_IMPORT_ROW_NUMBER_MAX),
    }),
    body: catalogImportRowFixSchema,
    summary: 'Fix one row of the preview — its product’s rows are judged again and the counts move',
    responses: {
      200: catalogImportFixedSchema,
      ...guarded,
      /** No such job or row in this company. */
      404: notFound,
      /** The job is not previewed: a new mapping is matching it, or it runs or has run. */
      409: wrongState,
      /** An answer on a row that asks no question — `details[].issue` says so. */
      422: errorEnvelope(baseError('DOMAIN_RULE_VIOLATION')),
    },
  },
});
