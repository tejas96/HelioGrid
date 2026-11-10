import type { ImportColumnView } from '@heliogrid/domain';
import { FILE_MAX_BYTES, SPREADSHEET_CONTENT_TYPES } from '@heliogrid/domain';
import type {
  ImportColumnsProps,
  ImportColumnsWords,
  ImportFileWords,
  ImportFormats,
  ImportJobFacts,
  ImportSheetPick,
} from './Import.types';

/** What both halves of the shared parts draw from a job: the file chip and its lines. Pure. */

/** What an import's chooser takes: the spreadsheet types, with their extensions. */
export const IMPORT_FILE_ACCEPT = ['.xlsx', '.csv', ...SPREADSHEET_CONTENT_TYPES].join(',');

/** The store's ceiling in MB, as the hint and the refusal state it. */
export const IMPORT_FILE_MAX_MB = FILE_MAX_BYTES / 1_000_000;

/** The file chip, the panel's subtitle and the report's stamp. */
export function importFileOf(
  job: ImportJobFacts,
  words: ImportFileWords,
  formats: ImportFormats,
  /** The person's sheet and header row before they are confirmed; the job's once they are. */
  draft: ImportSheetPick | null,
) {
  const mapping = draft ?? job.mapping;
  const sheet = job.sheets?.[mapping?.sheet ?? 0];
  // The rows under the header row, as the person counts their list — the header is not a row.
  const listed = Math.max(0, (sheet?.rowCount ?? 0) - 1 - (mapping?.headerRow ?? 0));
  const rows = job.counts?.rows ?? listed;
  const imported = job.run?.at ?? null;
  return {
    name: job.fileName,
    meta:
      job.status === 'unreadable'
        ? words.fileProblem
        : words.fileMeta(rows, sheet?.columnCount ?? 0),
    unreadable: job.status === 'unreadable',
    subtitle:
      imported === null || job.status !== 'completed'
        ? words.subtitle(job.fileName, rows)
        : words.subtitleImported(
            job.fileName,
            rows,
            formats.date(imported),
            formats.clockAt(imported),
          ),
    stamp:
      imported === null ? null : words.stamp(formats.date(imported), formats.clockAt(imported)),
  };
}

/** One cell of the header row: a file may repeat a header, so each cell keeps its column. */
export interface ImportHeaderCell {
  readonly column: number;
  readonly text: string;
}

/** The cells of the header row the step reads, for *Row N reads*. */
export function headerCellsOf(
  job: ImportJobFacts | null,
  mapping: ImportSheetPick | null,
): readonly ImportHeaderCell[] {
  if (job === null || mapping === null) return [];
  const sheet = job.sheets?.[mapping.sheet];
  const row = sheet?.topRows[mapping.headerRow] ?? [];
  return Array.from({ length: sheet?.columnCount ?? 0 }, (_, column) => ({
    column,
    text: row[column] ?? '',
  }));
}

/** The option that leaves a column out; never a field id. */
const LEAVE_OUT = 'leave-out';

/**
 * A column's field choice, for both halves: the field it fills — or *Leave this column out* once
 * the person chose that — the import's fields after it, and the line a left-out column carries.
 */
export function columnChoiceOf<Field extends string>(
  view: ImportColumnView<Field>,
  words: ImportColumnsWords,
  fields: ImportColumnsProps<Field>['fields'],
  left: boolean,
) {
  return {
    value: view.field ?? (left ? LEAVE_OUT : undefined),
    placeholder: words.chooseField,
    closeLabel: words.closeList,
    ariaLabel: words.importColumnAs(view.header),
    options: [
      { value: LEAVE_OUT, label: words.leaveColumnOut },
      ...fields.map((field) => ({ value: field.value, label: field.label })),
    ],
    helper: left ? words.leftOutHelper : undefined,
    density: 'functional' as const,
  };
}
