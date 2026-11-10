import type { TranslatedText } from '@heliogrid/contracts';
import { LEAD_IMPORT_FIELDS, type LeadImportField } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { DataTableColumn } from '../DataTable/DataTable.types';
import type { LeadImportProps, LeadImportRow } from './LeadImport.types';

/**
 * The rows' table, for both halves (`SCR-M02-05`): one row a sheet row, its cells by the field each
 * fills, as the file wrote them; a blank cell is a named gap. The preview's columns are the lead's
 * fields and what happens; the report's are the file's own headers and why.
 */

/** A sheet row as the table reads it: its cells lifted beside the row they came from. */
export type LeadImportTableRow = Readonly<Partial<Record<LeadImportField, string>>> & {
  readonly id: string;
  readonly rowNumber: number;
  readonly row: LeadImportRow;
};

export function tableRowsOf(rows: readonly LeadImportRow[]): LeadImportTableRow[] {
  return rows.map((row) => ({ ...cellsOf(row), id: row.id, rowNumber: row.rowNumber, row }));
}

function cellsOf(row: LeadImportRow): Partial<Record<LeadImportField, string>> {
  const cells: Partial<Record<LeadImportField, string>> = {};
  for (const field of LEAD_IMPORT_FIELDS) {
    const cell = row.cells[field];
    if (cell !== undefined) cells[field] = cell;
  }
  return cells;
}

/**
 * The columns for the phase: the row's number, its cells, and the mark the half draws — what
 * happens to it in the preview, why it was turned away in the report.
 */
export function rowColumnsOf(
  props: Pick<LeadImportProps, 'words' | 'headers'> & { readonly phase: 'preview' | 'report' },
  mark: (row: LeadImportRow) => ReactNode,
): DataTableColumn<LeadImportTableRow>[] {
  const { words } = props;
  const number: DataTableColumn<LeadImportTableRow> = {
    key: 'rowNumber',
    label: words.rowLabel,
    mono: true,
    muted: true,
    width: '6%',
  };
  const cell = (
    field: LeadImportField,
    label: TranslatedText,
  ): DataTableColumn<LeadImportTableRow> => ({
    key: field,
    label,
    primary: field === 'name',
    mono: field === 'phone' || field === 'monthly_bill',
    numeric: field === 'monthly_bill',
    ...(field === 'monthly_bill' ? { provenance: 'assumed' as const } : {}),
    gap: (row) => (row[field] === undefined ? words.blank : null),
  });
  const fields =
    props.phase === 'preview'
      ? LEAD_IMPORT_FIELDS.map((field) => cell(field, words.fields[field]))
      : props.headers.map((header) => cell(header.field, words.fileHeader(header.header)));
  return [
    number,
    ...fields,
    {
      key: 'fate',
      label: props.phase === 'preview' ? words.whatHappens : words.why,
      width: props.phase === 'preview' ? '30%' : '28%',
      render: ({ row }) => mark(row),
    },
  ];
}
