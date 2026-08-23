import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { Checkbox } from '../Checkbox';
import { renderPending } from '../PendingAction';
import { renderProvenance } from '../Provenance';
import { alignOf, isLiveCell } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { DataTableCell } from './DataTableCell';
import { CellShell } from './DataTableCellShell';
import { RowNote } from './DataTableChrome';
import type { RowState } from './DataTableRow.logic';
import { needsRoom, resolveRow } from './DataTableRow.logic';

/**
 * **The row's ground**, on the cells and again on the line beneath them so the two read as one
 * record. Selection wins over the issue tint, which wins over zebra — the stylesheet's order.
 */
function rowTintAttrs(state: RowState) {
  return {
    'data-selected': state.isSelected ? 'true' : undefined,
    'data-issue': state.issue === null ? undefined : 'true',
    'data-fixed': state.issue === null && state.flagged ? 'true' : undefined,
    'data-zebra': state.zebra ? 'true' : undefined,
  };
}

/**
 * **How the row is drawn and how it behaves** — the stylesheet's own hooks. The row's two
 * ANNOUNCEMENTS are not here: they are written on the `<tr>` itself, where a reader (and the
 * parity gate, which cannot follow a quoted key through a spread) can see the words the native
 * half has to match.
 */
function rowSignalAttrs(state: RowState, clickable: boolean) {
  return {
    'data-muted': state.muted ? 'true' : undefined,
    'data-clickable': clickable ? 'true' : undefined,
  };
}

/**
 * **The row's own line, under the cells it is about**: the act in flight, then what is wrong in
 * words. It repeats the row's ground so the pair reads as one record rather than two rows.
 */
function RowLine<Row>({
  state,
  row,
  table,
  spanAll,
  pending,
}: {
  state: RowState;
  row: Row;
  table: DataTableProps<Row>;
  spanAll: number;
  /** The act's own line, already resolved — a returned act still has one; only `aria-busy` stops. */
  pending: ReactNode;
}) {
  return (
    <tr className="hg-dt-row-line" data-flow-row-note="" {...rowTintAttrs(state)}>
      <td colSpan={spanAll}>
        {pending === null ? null : (
          <div className="hg-dt-row-pending" data-spaced={state.flagged ? 'true' : undefined}>
            {pending}
          </div>
        )}
        {state.flagged ? (
          <RowNote
            issue={state.issue}
            fixed={state.fixed}
            action={table.rowIssueAction?.(row) ?? null}
          />
        ) : null}
      </td>
    </tr>
  );
}

export interface BodyRowProps<Row> {
  row: Row;
  index: number;
  columns: DataTableProps<Row>['columns'];
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
  /** The cell that carries the record's standing — the primary column. */
  provenanceColumn: DataTableProps<Row>['columns'][number] | undefined;
  spanAll: number;
  table: DataTableProps<Row>;
}

/**
 * **One record, as a grid row** — its cells, and the line beneath them when it has something to
 * say. The four signals it renders are resolved by `resolveRow`, so the card form reads the same
 * row the same way.
 */
export function DataTableBodyRow<Row>({
  row,
  index,
  columns,
  rowKey,
  selectable,
  selected,
  onToggleRow,
  provenanceColumn,
  spanAll,
  table,
}: BodyRowProps<Row>) {
  const { onRowClick, rowActions } = table;
  const state = resolveRow(table, rowKey, row, index, selected);
  const pending = renderPending(state.pending);
  /* The record's own standing, resolved from the caller's spec. The SLOT is gated on the rendered
     node, not on the prop: a table with a `rowProvenance` that returns null for this record must
     not grow an empty box under its name. */
  const standing = renderProvenance(state.standing, { size: 12 });

  return (
    <Fragment>
      <tr
        className="hg-dt-row"
        data-flow-row=""
        {...rowTintAttrs(state)}
        {...rowSignalAttrs(state, onRowClick !== undefined)}
        /* WHAT THE ROW ANNOUNCES ABOUT ITSELF, written here rather than folded into the spread
           above. `aria-busy` is the act in flight and `aria-invalid` the broken row — never the
           two confused: a pending row is still correct, and still operable. The native half
           spells the first as `accessibilityState.busy` on its `role="row"` View. */
        aria-invalid={state.issue === null ? undefined : true}
        aria-busy={state.waiting ? true : undefined}
        onClick={onRowClick === undefined ? undefined : () => onRowClick(row)}
      >
        {selectable ? (
          // biome-ignore lint/a11y/useKeyWithClickEvents: this only stops the row's click reaching the tick; the control inside carries every interaction, and a key handler here would fire the row from the checkbox.
          <td
            className="hg-dt-cell-shell hg-dt-cell-shell--select"
            onClick={(event) => event.stopPropagation()}
          >
            <Checkbox
              className="hg-dt-tick"
              checked={state.isSelected}
              ariaLabel={`Select row ${String(state.key)}`}
              onChange={() => onToggleRow(state.key)}
            />
          </td>
        ) : null}
        {columns.map((column, columnIndex) => {
          const standingHere = standing !== null && column === provenanceColumn;
          return (
            <CellShell
              key={column.key}
              column={column}
              align={alignOf(column)}
              columnIndex={columnIndex}
              columnCount={columns.length}
              selectable={selectable}
              hasActions={rowActions !== undefined}
              roomy={needsRoom(column, table, standingHere)}
              live={isLiveCell(column, table.onCellCommit, table.cellIssue)}
            >
              <DataTableCell
                row={row}
                column={column}
                align={alignOf(column)}
                cellIssue={table.cellIssue}
                onCellCommit={table.onCellCommit}
              />
              {/* The record's own standing goes under the record's own name — the primary
                  cell, the one cell every row has and the one a reader is already on. */}
              {standingHere ? <span className="hg-dt-row-standing">{standing}</span> : null}
            </CellShell>
          );
        })}
        {rowActions === undefined ? null : (
          // biome-ignore lint/a11y/useKeyWithClickEvents: this only stops an action also firing the row it sits in; the actions themselves are the interactive elements.
          <td
            className="hg-dt-cell-shell hg-dt-cell-shell--actions"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="hg-dt-row-actions">{rowActions(row, { stacked: false })}</span>
          </td>
        )}
      </tr>
      {pending !== null || state.flagged ? (
        <RowLine state={state} row={row} table={table} spanAll={spanAll} pending={pending} />
      ) : null}
    </Fragment>
  );
}
