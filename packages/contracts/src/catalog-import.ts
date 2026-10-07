import {
  CATALOG_IMPORT_ENTRY_POINTS,
  CATALOG_IMPORT_FILE_NAME_MAX,
  CATALOG_IMPORT_STATES,
  CATALOG_IMPORT_UNREADABLE_REASONS,
  type CatalogImportSheet,
  FILE_CONTENT_TYPES,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
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
});
export type CatalogImportWire = z.infer<typeof catalogImportSchema>;

const guarded = {
  401: unauthenticatedEnvelope,
  403: errorEnvelope(baseError('FORBIDDEN')),
} as const;
const notFound = errorEnvelope(baseError('NOT_FOUND'));

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
});
