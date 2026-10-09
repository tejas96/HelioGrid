import {
  CATALOG_IMPORT_ENTRY_POINTS,
  CATALOG_IMPORT_FIELDS,
  CATALOG_IMPORT_FILE_NAME_MAX,
  CATALOG_IMPORT_ROW_NUMBER_MAX,
  CATALOG_IMPORT_STATES,
  CATALOG_IMPORT_UNREADABLE_REASONS,
  type CatalogImportMapping,
  type CatalogImportResults,
  type CatalogImportSheet,
  FILE_CONTENT_TYPES,
  importColumnsProblem,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  catalogImportCountsSchema,
  catalogImportFieldSchema,
  catalogImportFixedSchema,
  catalogImportRowFixSchema,
  catalogImportRowSchema,
  catalogImportRowsQuerySchema,
} from './catalog-import-rows';
import {
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

/** The run's counted progress (`SCR-M01-17` pass 3): rows written of rows to write, read off the rows. */
const catalogImportRunSchema = z.object({
  done: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  /** When the person pressed import. */
  at: z.string().datetime(),
  by: uuidSchema,
});

/** The report's figures: what the run did with every row, counted off the rows. */
export const catalogImportResultsSchema = z.object({
  priceApplied: z.number().int().nonnegative(),
  productCreated: z.number().int().nonnegative(),
  leftOut: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
}) satisfies z.ZodType<CatalogImportResults>;

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
  /** Null until the import is run; then its progress, which stays at its end once completed. */
  run: catalogImportRunSchema.nullable(),
  /** Null until the run has completed. */
  results: catalogImportResultsSchema.nullable(),
});
export type CatalogImportWire = z.infer<typeof catalogImportSchema>;

const guarded = {
  401: unauthenticatedEnvelope,
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
    summary:
      'A page of the preview grid, or of the report, by sheet row number — narrowed to one outcome or one result when asked',
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
    summary:
      'Fix one row of the preview, or a row a completed run left open — its product’s rows are judged again and the counts move',
    responses: {
      200: catalogImportFixedSchema,
      ...guarded,
      /** No such job or row in this company. */
      404: notFound,
      /** A new mapping is matching the job, it is running, or the run wrote this row. */
      409: wrongState,
      /** An answer on a row that asks no question — `details[].issue` says so. */
      422: errorEnvelope(baseError('DOMAIN_RULE_VIOLATION')),
    },
  },
  run: {
    method: 'POST',
    path: '/catalog/imports/:id/run',
    pathParams: z.object({ id: uuidSchema }),
    body: c.noBody(),
    summary:
      'Import the previewed rows, or a completed job’s fixed open rows — the run writes them in the background and the job is polled; a job with nothing to write answers as it stands',
    responses: {
      200: catalogImportSchema,
      ...guarded,
      404: notFound,
      /** The job is not previewed yet: it is reading, unreadable, mapped or matching. */
      409: wrongState,
    },
  },
});
