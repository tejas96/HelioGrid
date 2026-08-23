import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Checkbox } from '../Checkbox/Checkbox.native';
import { renderPending } from '../PendingAction/PendingAction.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import type { ProvenanceProps } from '../Provenance/Provenance.types';
import { alignOf } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { CardDetails } from './DataTableCardDetails.native';
import { DataTableCell } from './DataTableCell.native';
import { tickPullback } from './DataTableChrome.native';
import { RowNote } from './DataTableFeedback.native';
import type { RowState } from './DataTableRow.logic';
import { resolveRow } from './DataTableRow.logic';
import type { StackedColumns } from './DataTableStacked.logic';
import { rowNameOf } from './DataTableStacked.logic';

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['surface-alt'],
  },
  /* The card's inset rides on the node BELOW the ground, so a clickable card's target covers the
     whole card and not just its content box — the web half's target is `inset: 0`. */
  pad: { padding: theme.spacing['sp-4'] },
  issue: { backgroundColor: theme.colors['warning-bg'] },
  fixed: { backgroundColor: theme.colors['success-bg'] },
  selected: { backgroundColor: theme.colors['accent-subtle'] },
  muted: { opacity: 0.55 },
  body: {
    flexDirection: 'row',
    gap: theme.spacing['sp-3'],
    alignItems: 'flex-start',
    minHeight: MIN_TOUCH_TARGET,
  },
  main: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  title: { flex: 1, minWidth: 0 },
  standing: { marginTop: 6 },
  after: { marginTop: theme.spacing['sp-3'] },
  actions: {
    marginTop: theme.spacing['sp-3'],
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: MIN_TOUCH_TARGET,
  },
  select: { paddingTop: 2 },
});

/** **The card's ground** — the same order the grid row holds: selection, then issue, then resolved. */
function cardTintStyle(state: RowState): StyleProp<ViewStyle> {
  return [
    styles.card,
    state.issue !== null ? styles.issue : state.flagged ? styles.fixed : null,
    state.isSelected ? styles.selected : null,
    state.muted ? styles.muted : null,
  ];
}

/**
 * **What the card says after its figures** — the act in flight, what is wrong in words, and the
 * actions the phone must not lose (`F7-31`). Each is a control in its own right, so an action
 * never also fires the row.
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
  /* The LINE follows the act, not the waiting: a returned act is settled — the card stops
     announcing itself busy — and its line is the only place the reader learns why it came back. */
  const pending = renderPending(state.pending);
  return (
    <>
      {pending === null ? null : <View style={styles.after}>{pending}</View>}
      {state.flagged ? (
        <View style={styles.after}>
          <RowNote
            issue={state.issue}
            fixed={state.fixed}
            action={table.rowIssueAction?.(row) ?? null}
          />
        </View>
      ) : null}
      {rowActions === undefined ? null : (
        <View style={styles.actions}>{rowActions(row, { stacked: true })}</View>
      )}
    </>
  );
}

/** The record's own body: its name, the figure beside it, and everything under both. */
function CardBody<Row>({
  row,
  state,
  standing,
  name,
  selectable,
  onToggleRow,
  slots,
  table,
  tableSpec,
}: {
  row: Row;
  state: RowState;
  /** The record's standing, already rendered — the slot is gated on the node, never on the prop. */
  standing: ReactNode;
  name: string;
  selectable: boolean;
  onToggleRow: (key: string | number) => void;
  slots: StackedColumns<Row> & { primary: DataTableProps<Row>['columns'][number] };
  table: DataTableProps<Row>;
  tableSpec: ProvenanceProps | null;
}) {
  const { primary, secondary, trailing, rest } = slots;
  const cell = (column: DataTableProps<Row>['columns'][number]) => (
    <DataTableCell
      row={row}
      column={column}
      align={alignOf(column)}
      cellIssue={table.cellIssue}
      onCellCommit={table.onCellCommit}
    />
  );

  return (
    <View style={styles.body}>
      {selectable ? (
        <View style={styles.select}>
          <Checkbox
            checked={state.isSelected}
            ariaLabel={`Select ${name}`}
            onChange={() => onToggleRow(state.key)}
            style={tickPullback}
          />
        </View>
      ) : null}
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <View style={styles.title}>{cell(primary)}</View>
          {trailing === undefined ? null : <View>{cell(trailing)}</View>}
        </View>
        {secondary === undefined ? null : <View>{cell(secondary)}</View>}
        {/* The record's standing, under the record's name. */}
        {standing === null ? null : <View style={styles.standing}>{standing}</View>}
        <CardDetails row={row} columns={rest} table={table} tableSpec={tableSpec} />
        <CardNotes row={row} state={state} table={table} />
      </View>
    </View>
  );
}

export interface NativeCardProps<Row> {
  row: Row;
  index: number;
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
  slots: StackedColumns<Row> & { primary: DataTableProps<Row>['columns'][number] };
  table: DataTableProps<Row>;
  /** The table-wide statement a column's tier is measured against, resolved once for the list. */
  tableSpec: ProvenanceProps | null;
}

/**
 * **One record, as a card.** Every per-row capability reaches it (`F7-31`).
 *
 * **The row target wraps only the record's own body**, and every operable part inside it (the
 * checkbox, a live cell, the row note, the actions) is a control in its own right — RN dispatches
 * a press to the innermost responder, so an action never also fires the row. That is the same
 * separation the web half gets from an overlay button beside the content.
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
}: NativeCardProps<Row>) {
  const { onRowClick } = table;
  const state = resolveRow(table, rowKey, row, index, selected);
  const name = rowNameOf(row, slots.primary, table.rowLabel);
  /* Gated on the RENDERED node, not on the prop: a `rowProvenance` that returns null for this
     record must not leave an empty standing box under its name. */
  const standing = renderProvenance(state.standing, { size: 12 });
  const body = (
    <CardBody
      row={row}
      state={state}
      standing={standing}
      name={name}
      selectable={selectable}
      onToggleRow={onToggleRow}
      slots={slots}
      table={table}
      tableSpec={tableSpec}
    />
  );

  return (
    /* THE CARD ITSELF CARRIES THE WAIT, clickable or not — the web half's `aria-busy` is on the
       card, never on its press target. And the state needs a node to sit on: a bare `View` is not
       an accessibility element, so the state hung on one was announced nowhere (the trap
       `SelectionBar` documents). `role` makes it one without `accessible`, which would fold the
       tick, the live cells, the row note and the 44dp actions into a single element; `listitem` is
       the `<li>` this View already is, inside the `accessibilityRole="list"` the stacked form
       carries. */
    <View role="listitem" accessibilityState={{ busy: state.waiting }} style={cardTintStyle(state)}>
      {onRowClick === undefined ? (
        <View style={styles.pad}>{body}</View>
      ) : (
        <RNPressable
          accessibilityRole="button"
          accessibilityLabel={name}
          onPress={() => onRowClick(row)}
          style={styles.pad}
        >
          {body}
        </RNPressable>
      )}
    </View>
  );
}
