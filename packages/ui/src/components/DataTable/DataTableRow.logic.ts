import type { PendingActionSpec } from '../PendingAction';
import { isLiveCell, rowKeyOf } from './DataTable.logic';
import type { DataTableProps, DataTableProvenanceSpec } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';

/**
 * **What one row is saying**, resolved once for both platform halves and for both forms — the grid
 * row and the stacked card — so the four signals cannot be read differently in four places.
 *
 * `issue` says the row is **broken**, `fixed` is the caller's acceptance of the repair, `muted` says
 * done-and-inactive. **`waiting` is none of the three**: an act in flight adds a line and nothing
 * else — no tint, no dim, no disable — because the row must be visibly pending **and still
 * operable**.
 */
export interface RowState {
  key: string | number;
  isSelected: boolean;
  /** The sentence saying what is wrong with this row, or null. */
  issue: string | null;
  /** The caller's acceptance of the fix — `true`, its own words, or null. */
  fixed: boolean | string | null;
  /** True when the row carries either the issue tint or the resolved tint. */
  flagged: boolean;
  /**
   * The act the row is reporting, still in flight or already returned. **The line follows this**,
   * because a returned act is the only place the reader learns why it came back.
   */
  pending: PendingActionSpec | null;
  /**
   * **Still in flight** — `pending` that has not `returned`. Only `aria-busy` follows this: a
   * settled act must not leave the row announcing itself busy for the rest of the session.
   */
  waiting: boolean;
  /**
   * The record's own standing **as a spec**, to be rendered under the record's own name. Both
   * surfaces resolve it through `renderProvenance` and then gate the slot on the RENDERED node: a
   * resolver that returns `null` for this row must leave no empty standing box behind.
   */
  standing: DataTableProvenanceSpec | null;
  /** Done-and-inactive. Never a problem marker. */
  muted: boolean;
  /** Odd rows take the alternate ground. */
  zebra: boolean;
}

export function resolveRow<Row>(
  table: DataTableProps<Row>,
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>,
  row: Row,
  index: number,
  selected: (string | number)[],
): RowState {
  const key = rowKeyOf(rowKey, row, index);
  const issue = table.rowIssue === undefined ? null : table.rowIssue(row);
  const fixed = issue === null && table.rowResolved !== undefined ? table.rowResolved(row) : null;
  const pending = table.rowPending === undefined ? null : table.rowPending(row);
  return {
    key,
    isSelected: selected.includes(key),
    issue,
    fixed,
    flagged: issue !== null || (fixed !== null && fixed !== false),
    pending,
    waiting: pending !== null && pending.state !== 'returned',
    standing: table.rowProvenance?.(row) ?? null,
    muted: table.isRowMuted?.(row) === true,
    zebra: index % 2 === 1,
  };
}

/**
 * The cell that carries the record's standing: the primary column, the one cell every row has and
 * the one a reader is already on.
 */
export function provenanceColumnOf<Row>(
  columns: DataTableColumn<Row>[],
): DataTableColumn<Row> | undefined {
  return columns.find((column) => column.primary === true) ?? columns[0];
}

/**
 * **A cell needs vertical room when something grows under its value** — an editor, a marker, a
 * message, a wrapped line, or the record's standing. `standingHere` is the caller's, because only
 * the grid row hangs the record's standing inside a cell.
 */
export function needsRoom<Row>(
  column: DataTableColumn<Row>,
  table: DataTableProps<Row>,
  standingHere: boolean,
): boolean {
  return (
    isLiveCell(column, table.onCellCommit, table.cellIssue) ||
    column.wrap === true ||
    column.provenanceFor !== undefined ||
    standingHere
  );
}
