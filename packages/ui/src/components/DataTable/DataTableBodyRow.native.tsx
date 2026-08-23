import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Checkbox } from '../Checkbox/Checkbox.native';
import { renderPending } from '../PendingAction/PendingAction.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { alignOf, type DensitySpec } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { DataTableCell } from './DataTableCell.native';
import { CellShell } from './DataTableCellShell.native';
import { tickPullback } from './DataTableChrome.native';
import { RowNote } from './DataTableFeedback.native';
import type { RowState } from './DataTableRow.logic';
import { needsRoom, resolveRow } from './DataTableRow.logic';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  zebra: { backgroundColor: theme.colors['surface-alt'] },
  plain: { backgroundColor: theme.colors.surface },
  issue: { backgroundColor: theme.colors['warning-bg'] },
  fixed: { backgroundColor: theme.colors['success-bg'] },
  selected: { backgroundColor: theme.colors['accent-subtle'] },
  muted: { opacity: 0.55 },
  actions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  standing: { marginTop: theme.spacing['sp-1'] },
  spaced: { marginBottom: 10 },
  /* The primitive centres its child inside the 44dp floor, which is right for a pill and wrong
     for a table row: the cells are a full-width line whose columns are sized by `column.width`.
     The floor stays; only the two alignment rules are handed back. */
  pressRow: { alignItems: 'stretch', justifyContent: 'flex-start' },
});

/**
 * **The row's ground.** Selection wins over the issue tint, which wins over zebra — the same order
 * the web half's stylesheet holds.
 */
function rowTintStyle(state: RowState): StyleProp<ViewStyle> {
  return [
    state.zebra ? styles.zebra : styles.plain,
    state.issue !== null ? styles.issue : state.flagged ? styles.fixed : null,
    state.isSelected ? styles.selected : null,
  ];
}

/**
 * **The row's own line, under the cells it is about**: the act in flight, then what is wrong in
 * words.
 */
function RowLine<Row>({
  state,
  row,
  table,
  spec,
  pending,
}: {
  state: RowState;
  row: Row;
  table: DataTableProps<Row>;
  spec: DensitySpec;
  /** The act's own line, already resolved — a returned act still has one; only `busy` stops. */
  pending: ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: spec.edge, paddingBottom: theme.spacing['sp-3'] }}>
      {pending === null ? null : (
        <View style={state.flagged ? styles.spaced : undefined}>{pending}</View>
      )}
      {state.flagged ? (
        <RowNote
          issue={state.issue}
          fixed={state.fixed}
          action={table.rowIssueAction?.(row) ?? null}
        />
      ) : null}
    </View>
  );
}

/** The record's cells, in one line, sized by the density in force. */
function RowCells<Row>({
  row,
  state,
  standing,
  selectable,
  onToggleRow,
  provenanceColumn,
  spec,
  table,
}: {
  row: Row;
  state: RowState;
  /** The record's standing, already rendered — the slot is gated on the node, never on the prop. */
  standing: ReactNode;
  selectable: boolean;
  onToggleRow: (key: string | number) => void;
  provenanceColumn: DataTableProps<Row>['columns'][number] | undefined;
  spec: DensitySpec;
  table: DataTableProps<Row>;
}) {
  const { columns, rowActions } = table;
  const gutter = { paddingHorizontal: spec.gutter };

  return (
    <View
      style={[
        styles.row,
        { minHeight: spec.rowH, paddingHorizontal: spec.edge - spec.gutter },
        state.muted ? styles.muted : null,
      ]}
    >
      {selectable ? (
        <View style={[{ width: spec.selW }, gutter]}>
          <Checkbox
            checked={state.isSelected}
            ariaLabel={`Select row ${String(state.key)}`}
            onChange={() => onToggleRow(state.key)}
            style={tickPullback}
          />
        </View>
      ) : null}
      {columns.map((column) => {
        const standingHere = standing !== null && column === provenanceColumn;
        return (
          <CellShell
            key={column.key}
            width={column.width}
            align={alignOf(column)}
            gutter={spec.gutter}
            roomy={needsRoom(column, table, standingHere)}
          >
            <DataTableCell
              row={row}
              column={column}
              align={alignOf(column)}
              cellIssue={table.cellIssue}
              onCellCommit={table.onCellCommit}
            />
            {/* The record's own standing, under the record's own name. */}
            {standingHere ? <View style={styles.standing}>{standing}</View> : null}
          </CellShell>
        );
      })}
      {rowActions === undefined ? null : (
        <View style={[{ width: spec.actW }, gutter, styles.actions]}>
          {rowActions(row, { stacked: false })}
        </View>
      )}
    </View>
  );
}

export interface NativeBodyRowProps<Row> {
  row: Row;
  index: number;
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
  provenanceColumn: DataTableProps<Row>['columns'][number] | undefined;
  spec: DensitySpec;
  table: DataTableProps<Row>;
}

/**
 * **One record, as a grid row** — its cells, and the line beneath them when it has something to
 * say. A clickable row wraps only the cells, so the line beneath keeps its own controls.
 */
export function DataTableBodyRow<Row>({
  row,
  index,
  rowKey,
  selectable,
  selected,
  onToggleRow,
  provenanceColumn,
  spec,
  table,
}: NativeBodyRowProps<Row>) {
  const { onRowClick } = table;
  const state = resolveRow(table, rowKey, row, index, selected);
  const pending = renderPending(state.pending);
  const standing = renderProvenance(state.standing, { size: 12 });
  const cells = (
    <RowCells
      row={row}
      state={state}
      standing={standing}
      selectable={selectable}
      onToggleRow={onToggleRow}
      provenanceColumn={provenanceColumn}
      spec={spec}
      table={table}
    />
  );

  return (
    /* THE ROW ANNOUNCES ITSELF BUSY WHETHER OR NOT IT IS CLICKABLE. The web half's `aria-busy` sits
       on the `<tr>` unconditionally; carrying it only on the press target meant a pending row in a
       table with no `onRowClick` said nothing at all — a capability present at one configuration
       and absent at the other (`F7-31`), on the state `M02-67` exists to make visible.

       AND THE STATE NEEDS A NODE TO SIT ON. A bare `View` is not an accessibility element, so the
       state hung on one was announced nowhere — the same trap `SelectionBar` documents. `role`
       makes it one without `accessible`, which would fold the tick, the live cells and the 44dp
       row actions into a single element; `row` is the `<tr>` this View already is, inside the
       `role="table"` the grid carries.

       THE PRESS TARGET IS THE PACKAGE PRIMITIVE, not RN's own pressable. Reaching past it is how
       the 44dp floor and the semantics get lost together: `Pressable` already announces `button`
       (its documented default, the `<tr onClick>` the web half is) and takes the wait through
       `accessibilityState`, so nothing here has to spell a role out. */
    <View role="row" accessibilityState={{ busy: state.waiting }} style={rowTintStyle(state)}>
      {onRowClick === undefined ? (
        cells
      ) : (
        <Pressable
          accessibilityState={{ busy: state.waiting }}
          onPress={() => onRowClick(row)}
          style={styles.pressRow}
        >
          {cells}
        </Pressable>
      )}
      {pending !== null || state.flagged ? (
        <RowLine state={state} row={row} table={table} spec={spec} pending={pending} />
      ) : null}
    </View>
  );
}
