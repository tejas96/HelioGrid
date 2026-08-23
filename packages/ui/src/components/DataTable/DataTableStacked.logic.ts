import { isLiveCell, readField } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';

/**
 * **Which column plays which part on a card**, decided once for both platform halves.
 *
 * A `wrap` column takes the full card width with its label ABOVE it, and that treatment exists only
 * in the detail list — so a wrap column nominated as `secondary` or `trailing` is routed there
 * rather than silently losing both the layout and its tappability.
 */
export interface StackedColumns<Row> {
  primary: DataTableColumn<Row> | undefined;
  secondary: DataTableColumn<Row> | undefined;
  trailing: DataTableColumn<Row> | undefined;
  /** Everything else, as label/value pairs. */
  rest: DataTableColumn<Row>[];
}

export function resolveStackedColumns<Row>(columns: DataTableColumn<Row>[]): StackedColumns<Row> {
  const primary = columns.find((column) => column.primary === true) ?? columns[0];
  const secondaryRaw = columns.find((column) => column.secondary === true);
  const trailingRaw = columns.find((column) => column.trailing === true);
  const secondary = secondaryRaw?.wrap === true ? undefined : secondaryRaw;
  const trailing = trailingRaw?.wrap === true ? undefined : trailingRaw;
  return {
    primary,
    secondary,
    trailing,
    rest: columns.filter(
      (column) =>
        column !== primary &&
        column !== secondary &&
        column !== trailing &&
        column.hideStacked !== true,
    ),
  };
}

/**
 * **Which parts of the card take taps back.** The whole-card target is a sibling under the content
 * and the content itself is inert, so a slot re-enables taps only when what sits in it is operable
 * in its own right — a live cell, or a `wrap` column whose chips carry their own targets.
 */
export function isTappable<Row>(
  column: DataTableColumn<Row>,
  table: DataTableProps<Row>,
  withWrap: boolean,
): boolean {
  return (
    isLiveCell(column, table.onCellCommit, table.cellIssue) || (withWrap && column.wrap === true)
  );
}

/**
 * The card's whole-card target is a real button, so it needs an accessible name: the caller's
 * `rowLabel`, else the primary column's raw value, else a name that at least says what a press does.
 */
export function rowNameOf<Row>(
  row: Row,
  primary: DataTableColumn<Row>,
  rowLabel: DataTableProps<Row>['rowLabel'],
): string {
  if (rowLabel !== undefined) return rowLabel(row);
  const raw = readField(row, primary.key);
  return typeof raw === 'string' || typeof raw === 'number' ? String(raw) : 'Open record';
}
