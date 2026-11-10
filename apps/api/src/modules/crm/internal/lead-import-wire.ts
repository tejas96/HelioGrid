import type {
  DedupeMatchWire,
  LeadImport,
  LeadImportResult,
  LeadImportRowWire,
  LeadImportVerdict,
  StoredFile,
} from '@heliogrid/contracts';
import {
  hasImportPreview,
  hasImportRun,
  type ImportMappingProblem,
  LEAD_IMPORT_COLUMNS,
  type LeadImportMapping,
} from '@heliogrid/domain';
import type { LeadImportJob } from '../crm.lead-import.repository';
import type { LeadImportTallies, StoredLeadImportRow } from '../crm.lead-import-rows.repository';

/** The stored spreadsheets a lead import reads (`FILE_SUBJECT_RULES.lead_import`). */
export const LEAD_SPREADSHEET = 'lead_import';

/**
 * One job as the wizard polls it. Until the person confirms a mapping, the mapping is the guess the
 * file's headers make — English, Hindi or Marathi (`M02-18`) — for them to correct; the figures
 * appear as each phase reaches them.
 */
export function leadImportWire(
  job: LeadImportJob,
  file: Pick<StoredFile, 'id' | 'contentType' | 'byteSize'>,
  tallies: LeadImportTallies,
): LeadImport {
  const mapping =
    job.mapping ?? (job.sheets === null ? null : LEAD_IMPORT_COLUMNS.guessMapping(job.sheets));
  return {
    id: job.id,
    status: job.status,
    unreadableReason: job.unreadableReason,
    fileName: job.fileName,
    savedAt: job.savedAt?.toISOString() ?? null,
    startedBy: job.startedBy,
    createdAt: job.createdAt.toISOString(),
    file: { id: file.id, contentType: file.contentType, byteSize: file.byteSize },
    sheets:
      job.sheets?.map((sheet) => ({ ...sheet, topRows: sheet.topRows.map((row) => [...row]) })) ??
      null,
    mapping: mapping === null ? null : { ...mapping, columns: [...mapping.columns] },
    counts: hasImportPreview(job.status)
      ? { rows: tallies.rows, duplicates: tallies.duplicates, rejected: tallies.rejected }
      : null,
    run: runOf(job, tallies),
    results:
      job.status === 'completed'
        ? {
            landed: tallies.landed,
            logged: tallies.logged,
            skipped: tallies.skipped,
            rejected: tallies.rejected,
          }
        : null,
  };
}

/** The run's choice, when, who, and its progress — rows taken of the sheet's rows (`M02-21`). */
function runOf(job: LeadImportJob, tallies: LeadImportTallies): LeadImport['run'] {
  const { duplicateChoice, runAt, runBy } = job;
  if (!hasImportRun(job.status) || duplicateChoice === null || runAt === null || runBy === null) {
    return null;
  }
  return {
    duplicateChoice,
    at: runAt.toISOString(),
    by: runBy,
    done: tallies.ran,
    total: tallies.rows,
  };
}

/** One row of the preview or the report; a duplicate of a known customer carries the sheet's facts. */
export function leadImportRowWire(
  row: StoredLeadImportRow,
  facts: ReadonlyMap<string, DedupeMatchWire>,
): LeadImportRowWire {
  return {
    rowNumber: row.rowNumber,
    cells: { ...row.cells },
    phoneE164: row.phoneE164,
    verdict: verdictOf(row),
    problems: [...row.problems],
    duplicateOf:
      row.duplicateOfCustomerId === null ? null : (facts.get(row.duplicateOfCustomerId) ?? null),
    repeatsRow: row.repeatsRow,
    result: resultOf(row),
    leadId: row.leadId ?? row.enquiryLeadId,
  };
}

/** What a row names is what it is (0056): problems, a customer or an earlier row it met, or neither. */
function verdictOf(row: StoredLeadImportRow): LeadImportVerdict {
  if (row.problems.length > 0) return 'rejected';
  if (row.duplicateOfCustomerId !== null || row.repeatsRow !== null) return 'duplicate';
  return 'new';
}

function resultOf(row: StoredLeadImportRow): LeadImportResult | null {
  if (row.ranAt === null) return null;
  if (row.leadId !== null) return 'landed';
  if (row.enquiryActivityId !== null) return 'logged';
  return row.problems.length > 0 ? 'rejected' : 'skipped';
}

/** The body field each misfit is about, so the wizard marks the control that caused it. */
export const MAPPING_FIELD_OF: Readonly<Record<ImportMappingProblem, keyof LeadImportMapping>> = {
  sheet_missing: 'sheet',
  header_row_outside_top_rows: 'headerRow',
  more_columns_than_sheet: 'columns',
  required_field_unplaced: 'columns',
  field_placed_twice: 'columns',
};
