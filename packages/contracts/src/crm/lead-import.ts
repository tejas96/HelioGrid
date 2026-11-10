import {
  CATALOG_IMPORT_FILE_NAME_MAX,
  CATALOG_IMPORT_STATES,
  CATALOG_IMPORT_UNREADABLE_REASONS,
  FILE_CONTENT_TYPES,
  IMPORT_DUPLICATE_CHOICES,
  LEAD_IMPORT_FIELDS,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { catalogImportSheetSchema } from '../catalog-import';
import { createHeadersSchema, extensibleEnum, paginated, uuidSchema } from '../common';
import { baseError, errorEnvelope, keyReusedEnvelope, unauthenticatedEnvelope } from '../error';
import { fileErrorCodeSchema } from '../file';
import { leadImportRowSchema, leadImportRowsQuerySchema } from './lead-import-rows';
import { importDuplicateChoiceSchema } from './vocabulary';

const c = initContract();

/*
 * The lead import (`M02-18`…`M02-21`, `SCR-M02-05`): the catalog import's shape and machine, lifted.
 * A stored spreadsheet becomes a job read in the background; the wizard
 * maps its columns, the preview counts the rows and the duplicates by phone, and the run lands them
 * with one bulk choice for duplicates — skip, or log as enquiry; never keep both (`M02-20`).
 */

/** A field each column fills (`crm/lead-import-fields.ts`). */
export const leadImportFieldSchema = z.enum(LEAD_IMPORT_FIELDS);

/** Start an import from a stored `lead_import` file; the name and saved date are the picker's. */
export const leadImportStartSchema = z
  .object({
    fileId: uuidSchema,
    fileName: z.string().trim().min(1).max(CATALOG_IMPORT_FILE_NAME_MAX),
    savedAt: z.string().datetime().nullable(),
  })
  .strict();
export type LeadImportStart = z.infer<typeof leadImportStartSchema>;

/**
 * The columns step's confirm: the sheet, its header row and the field each column fills. The phone
 * placed once and no field twice, fitting the job's sheets, is domain's rule the service answers
 * with 422 (`leadImportMappingProblem`), the one the wizard holds its confirm to.
 */
export const leadImportMappingSchema = z
  .object({
    sheet: z.number().int().nonnegative(),
    headerRow: z.number().int().nonnegative(),
    columns: z.array(leadImportFieldSchema.nullable()),
  })
  .strict();
export type LeadImportMappingWrite = z.infer<typeof leadImportMappingSchema>;

/** Run the previewed rows with the one choice every duplicate follows (`M02-20`); skip unless said. */
export const leadImportRunSchema = z
  .object({ duplicateChoice: importDuplicateChoiceSchema.default('skip') })
  .strict();
export type LeadImportRun = z.infer<typeof leadImportRunSchema>;

/**
 * One job, the read the wizard polls. `sheets` is null until the file is read; `counts` until the
 * preview pass has judged the rows — "N rows · M duplicates by phone" (`M02-19`); `run` until it
 * is run; `results` until the run completes — how many landed, were logged, skipped or rejected.
 */
const leadImportShape = {
  id: uuidSchema,
  status: extensibleEnum(CATALOG_IMPORT_STATES),
  unreadableReason: extensibleEnum(CATALOG_IMPORT_UNREADABLE_REASONS).nullable(),
  fileName: z.string(),
  savedAt: z.string().datetime().nullable(),
  startedBy: uuidSchema,
  createdAt: z.string().datetime(),
  file: z.object({
    id: uuidSchema,
    contentType: extensibleEnum(FILE_CONTENT_TYPES),
    byteSize: z.number().int().positive(),
  }),
  sheets: z.array(catalogImportSheetSchema).nullable(),
  mapping: z
    .object({
      sheet: z.number().int().nonnegative(),
      headerRow: z.number().int().nonnegative(),
      columns: z.array(extensibleEnum(LEAD_IMPORT_FIELDS).nullable()),
    })
    .nullable(),
  counts: z
    .object({
      rows: z.number().int().nonnegative(),
      duplicates: z.number().int().nonnegative(),
      rejected: z.number().int().nonnegative(),
    })
    .nullable(),
  run: z
    .object({
      duplicateChoice: extensibleEnum(IMPORT_DUPLICATE_CHOICES),
      at: z.string().datetime(),
      by: uuidSchema,
      done: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    })
    .nullable(),
  results: z
    .object({
      landed: z.number().int().nonnegative(),
      logged: z.number().int().nonnegative(),
      skipped: z.number().int().nonnegative(),
      rejected: z.number().int().nonnegative(),
    })
    .nullable(),
};

/** Named, so each route answering a job references it rather than spelling its whole type. */
export interface LeadImportSchema extends z.ZodObject<typeof leadImportShape> {}
export const leadImportSchema: LeadImportSchema = z.object(leadImportShape);
export type LeadImport = z.infer<typeof leadImportSchema>;

const notFound = errorEnvelope(baseError('NOT_FOUND'));
/** The job is not where the act can happen — mapping a file not yet read, running one not previewed. */
const wrongState = errorEnvelope(baseError('CONFLICT'));
const importParams = z.object({ id: uuidSchema });

export const leadImportContract = c.router({
  start: {
    method: 'POST',
    path: '/lead-imports',
    headers: createHeadersSchema,
    body: leadImportStartSchema,
    summary:
      'Start a lead import from a stored spreadsheet — read in the background, the job polled',
    responses: {
      201: leadImportSchema,
      401: unauthenticatedEnvelope,
      /** No such file in this company. */
      404: notFound,
      409: errorEnvelope(fileErrorCodeSchema.extract(['FILE_NOT_UPLOADED'])),
      422: keyReusedEnvelope,
    },
  },
  import: {
    method: 'GET',
    path: '/lead-imports/:id',
    pathParams: importParams,
    summary: 'One lead import: where it is, its sheets once read, its counts and its results',
    responses: { 200: leadImportSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  map: {
    method: 'PUT',
    path: '/lead-imports/:id/mapping',
    pathParams: importParams,
    body: leadImportMappingSchema,
    summary:
      'Confirm the sheet, header row and columns — the preview pass judges every row in the background',
    responses: {
      200: leadImportSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      /** The job is reading, unreadable, running or completed. */
      409: wrongState,
      /** The phone is unplaced, a field is placed twice, or the mapping does not fit the sheets. */
      422: errorEnvelope(baseError('DOMAIN_RULE_VIOLATION')),
    },
  },
  rows: {
    method: 'GET',
    path: '/lead-imports/:id/rows',
    pathParams: importParams,
    query: leadImportRowsQuerySchema,
    summary:
      'A page of the preview or the report by sheet row, narrowed to one verdict or one result when asked',
    responses: {
      200: paginated(leadImportRowSchema),
      401: unauthenticatedEnvelope,
      404: notFound,
      /** The preview pass has not judged the rows. */
      409: wrongState,
    },
  },
  run: {
    method: 'POST',
    path: '/lead-imports/:id/run',
    pathParams: importParams,
    body: leadImportRunSchema,
    summary:
      'Land the previewed rows, each duplicate skipped or logged as an enquiry — in the background; landed rows are never rolled back',
    responses: {
      200: leadImportSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      /** The job is not previewed yet, or already ran. */
      409: wrongState,
    },
  },
});
