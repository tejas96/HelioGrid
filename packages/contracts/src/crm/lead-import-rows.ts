import { LEAD_IMPORT_PROBLEMS } from '@heliogrid/domain';
import { z } from 'zod';
import { extensibleEnum, paginationQuerySchema, phoneE164Schema, uuidSchema } from '../common';
import { dedupeMatchSchema } from './schemas';

/*
 * The lead import's rows (`M02-19`…`M02-21`): one per filled sheet row, as the preview pages them
 * and the report reads them. The routes are `leadImportContract`'s.
 */

/**
 * What the preview made of a row: a new lead; a duplicate — of a customer the number met, or of an
 * earlier row of the same file; or rejected, with every reason. Read off the row, never stored.
 */
export const leadImportVerdictSchema = z.enum(['new', 'duplicate', 'rejected']);
export type LeadImportVerdict = z.infer<typeof leadImportVerdictSchema>;

/**
 * What the run did with a row (`M02-21`): landed as a lead, logged as an enquiry on the existing
 * record, skipped by the duplicate choice, or rejected. Landed rows are never rolled back.
 */
export const leadImportResultSchema = z.enum(['landed', 'logged', 'skipped', 'rejected']);
export type LeadImportResult = z.infer<typeof leadImportResultSchema>;

/**
 * Why a row cannot land — the report names every one (`M02-21`): a number that does not read as one,
 * no number at all, a cell the import cannot read (a bill that is not an amount, a type that is no
 * segment), or a row the run could not write before it ended.
 */
export const leadImportProblemSchema = z.enum(LEAD_IMPORT_PROBLEMS);
export type LeadImportProblem = z.infer<typeof leadImportProblemSchema>;

/**
 * One row of the preview or the report. `cells` are the file's text by the field each fills;
 * `phoneE164` the number they read as, if any. A duplicate of a known customer carries the dedupe
 * sheet's facts (`M02-20`); one of an earlier row names it. Once run, `result` and the lead it
 * landed or the enquiry was logged on.
 */
export const leadImportRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  cells: z.record(z.string(), z.string()),
  phoneE164: phoneE164Schema.nullable(),
  verdict: extensibleEnum(leadImportVerdictSchema.options),
  problems: z.array(extensibleEnum(leadImportProblemSchema.options)),
  duplicateOf: dedupeMatchSchema.nullable(),
  repeatsRow: z.number().int().positive().nullable(),
  result: extensibleEnum(leadImportResultSchema.options).nullable(),
  leadId: uuidSchema.nullable(),
});
export type LeadImportRowWire = z.infer<typeof leadImportRowSchema>;

/** The preview's and the report's pages: every row, or one verdict's, or one result's. */
export const leadImportRowsQuerySchema = paginationQuerySchema.extend({
  verdict: leadImportVerdictSchema.optional(),
  result: leadImportResultSchema.optional(),
});
export type LeadImportRowsQuery = z.infer<typeof leadImportRowsQuerySchema>;
