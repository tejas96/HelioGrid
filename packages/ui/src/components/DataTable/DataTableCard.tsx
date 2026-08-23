import { Checkbox } from '../Checkbox';
import { renderPending } from '../PendingAction';
import type { ProvenanceProps } from '../Provenance';
import { renderProvenance } from '../Provenance';
import { alignOf } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { CardDetails } from './DataTableCardDetails';
import { DataTableCell } from './DataTableCell';
import { RowNote } from './DataTableChrome';
import type { RowState } from './DataTableRow.logic';
import { resolveRow } from './DataTableRow.logic';
import type { StackedColumns } from './DataTableStacked.logic';
import { isTappable, rowNameOf } from './DataTableStacked.logic';

/**
 * **How the card is drawn** — the same ground the grid row carries, as the stylesheet's own
 * hooks. The card's two ANNOUNCEMENTS are written on the card element itself, where a reader
 * (and the parity gate, which cannot follow a quoted key through a spread) can see the words the
 * native half has to match.
 */
function cardStateAttrs(state: RowState) {
  return {
    'data-selected': state.isSelected ? 'true' : undefined,
    'data-issue': state.issue === null ? undefined : 'true',
    'data-fixed': state.issue === null && state.flagged ? 'true' : undefined,
    'data-muted': state.muted ? 'true' : undefined,
  };
}

/**
 * **What the card says after its figures** — the act in flight, what is wrong in words, and the
 * actions the phone must not lose (`F7-31`). Each is a tappable island in an otherwise inert body.
 */
function CardNotes<Row>({
  row,
  state,
  table,
}: {
  row: Row;
  state: RowState;
  table: DataTableProps<Row>;
}) {
  const { rowActions } = table;
  /* The LINE follows the act, not the waiting: a returned act is settled — `aria-busy` comes off
     the card — and its line is the only place the reader learns why it came back. */
  const pending = renderPending(state.pending);
  return (
    <>
      {pending === null ? null : <div className="hg-dt-card-pending hg-dt-tappable">{pending}</div>}
      {state.flagged ? (
        <div className="hg-dt-card-note hg-dt-tappable">
          <RowNote
            issue={state.issue}
            fixed={state.fixed}
            action={table.rowIssueAction?.(row) ?? null}
          />
        </div>
      ) : null}
      {rowActions === undefined ? null : (
        <div className="hg-dt-card-actions hg-dt-tappable">
          {rowActions(row, { stacked: true })}
        </div>
      )}
    </>
  );
}

export interface CardProps<Row> {
  row: Row;
  index: number;
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
  /** Which column plays which part, resolved once for the whole list. */
  slots: StackedColumns<Row> & { primary: DataTableProps<Row>['columns'][number] };
  table: DataTableProps<Row>;
  /** The table-wide statement a column's tier is measured against, resolved once for the list. */
  tableSpec: ProvenanceProps | null;
}

/**
 * **One record, as a card.** Every per-row capability reaches it (`F7-31` forbids a capability
 * present at one viewport and absent at the other).
 *
 * **The row target is a sibling, not an ancestor.** The whole-card target is an absolutely
 * positioned `<button>` *under* the content, and the content sits above it with pointer events
 * off, re-enabled only on the parts that are themselves operable. Nothing nests, no handler needs
 * `stopPropagation`, and both the row and each action are separately reachable by keyboard.
 */
export function DataTableCard<Row>({
  row,
  index,
  rowKey,
  selectable,
  selected,
  onToggleRow,
  slots,
  table,
  tableSpec,
}: CardProps<Row>) {
  const { onRowClick } = table;
  const { primary, secondary, trailing, rest } = slots;
  const state = resolveRow(table, rowKey, row, index, selected);
  const name = rowNameOf(row, primary, table.rowLabel);
  /* Gated on the RENDERED node, not on the prop: a table with a `rowProvenance` that returns null
     for this record must not grow an empty standing box under its name. */
  const standing = renderProvenance(state.standing, { size: 12 });

  return (
    <li className="hg-dt-card-item" data-flow-row="">
      <div
        className="hg-dt-card"
        {...cardStateAttrs(state)}
        /* THE CARD ITSELF CARRIES THE WAIT, clickable or not — never its press target. The native
           half spells the same two on its `role="listitem"` View: `accessibilityState.busy` for
           the act in flight, and the issue tint for the broken record. */
        aria-invalid={state.issue === null ? undefined : true}
        aria-busy={state.waiting ? true : undefined}
      >
        {onRowClick === undefined ? null : (
          <button
            type="button"
            className="hg-dt-card-target"
            aria-label={name}
            onClick={() => onRowClick(row)}
          />
        )}
        <div className="hg-dt-card-body" data-inert={onRowClick === undefined ? undefined : 'true'}>
          {selectable ? (
            <span className="hg-dt-card-select hg-dt-tappable">
              <Checkbox
                className="hg-dt-tick"
                checked={state.isSelected}
                ariaLabel={`Select ${name}`}
                onChange={() => onToggleRow(state.key)}
              />
            </span>
          ) : null}
          <div className="hg-dt-card-main">
            <div className="hg-dt-card-title-row">
              <span
                className="hg-dt-card-title"
                data-tappable={isTappable(primary, table, true) ? 'true' : undefined}
              >
                <DataTableCell
                  row={row}
                  column={primary}
                  align={alignOf(primary)}
                  cellIssue={table.cellIssue}
                  onCellCommit={table.onCellCommit}
                />
              </span>
              {trailing === undefined ? null : (
                <span
                  className="hg-dt-card-trailing"
                  data-tappable={isTappable(trailing, table, false) ? 'true' : undefined}
                >
                  <DataTableCell
                    row={row}
                    column={trailing}
                    align={alignOf(trailing)}
                    cellIssue={table.cellIssue}
                    onCellCommit={table.onCellCommit}
                  />
                </span>
              )}
            </div>
            {secondary === undefined ? null : (
              <div
                className="hg-dt-card-secondary"
                data-tappable={isTappable(secondary, table, false) ? 'true' : undefined}
              >
                <DataTableCell
                  row={row}
                  column={secondary}
                  align={alignOf(secondary)}
                  cellIssue={table.cellIssue}
                  onCellCommit={table.onCellCommit}
                />
              </div>
            )}
            {/* The record's standing, under the record's name — the card's answer to the
                slot the desktop row fills under its primary cell. */}
            {standing === null ? null : <div className="hg-dt-card-standing">{standing}</div>}
            <CardDetails row={row} columns={rest} table={table} tableSpec={tableSpec} />
            <CardNotes row={row} state={state} table={table} />
          </div>
        </div>
      </div>
    </li>
  );
}
