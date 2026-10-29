import type { ReactNode } from 'react';
import { readField } from './DataTable.logic';
import type { DataTableColumn, DataTableLeading } from './DataTableColumn.types';

/** A figure column sets in mono: the column says so, or it holds numbers. */
export function isMonoColumn<Row>(column: DataTableColumn<Row>): boolean {
  return column.mono === true || column.numeric === true;
}

/** The record's name, or a column the caller marked strong, sets in weight. */
export function isStrongColumn<Row>(column: DataTableColumn<Row>): boolean {
  return column.primary === true || column.strong === true;
}

/** An editor types in mono when its column is a figure column or it takes a number. */
export function isMonoEditor<Row>(column: DataTableColumn<Row>): boolean {
  return isMonoColumn(column) || column.editor === 'number';
}

/** The value a cell shows when the column has no `render`: a string or a number, else nothing. */
export function plainFieldOf<Row>(row: Row, column: DataTableColumn<Row>): string | number | null {
  const raw = readField(row, column.key);
  return typeof raw === 'string' || typeof raw === 'number' ? raw : null;
}

/** What an editor starts from: the column's `editValue`, else the field itself, as text. */
export function editTextOf<Row>(row: Row, column: DataTableColumn<Row>): string {
  const raw = column.editValue !== undefined ? column.editValue(row) : readField(row, column.key);
  return raw === undefined || raw === null ? '' : String(raw);
}

/**
 * **What a draft commits as**, or null when it commits nothing and the last good value comes back:
 * empty never commits, and a number column never commits what is not a number.
 */
export function committedValueOf<Row>(
  draft: string,
  column: DataTableColumn<Row>,
): string | number | null {
  const trimmed = draft.trim();
  if (trimmed === '') return null;
  const value = column.editor === 'number' ? Number.parseFloat(trimmed) : trimmed;
  return typeof value === 'number' && Number.isNaN(value) ? null : value;
}

/** The kind tile and the quiet line a cell leads with, or null when the column asks for neither. */
export function cellLeadOf<Row>(
  row: Row,
  column: DataTableColumn<Row>,
): { leading: DataTableLeading | null; sub: ReactNode } | null {
  const leading = column.leading?.(row) ?? null;
  const sub = column.sub?.(row) ?? null;
  return leading === null && sub === null ? null : { leading, sub };
}
