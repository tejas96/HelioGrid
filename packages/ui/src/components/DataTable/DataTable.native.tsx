import { theme } from '@heliogrid/theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { showsMessage, sortRows } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { Pagination, SelectionBar } from './DataTableChrome.native';
import { DataTableGrid } from './DataTableGrid.native';
import { TableCaption, TableStates } from './DataTableShell.native';
import { DataTableStacked } from './DataTableStacked.native';
import { useTableSelection, useTableSort } from './use-table-state';

const styles = StyleSheet.create({
  shell: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-functional'],
    overflow: 'hidden',
    ...theme.elevation.e2,
  },
  band: { paddingTop: 14, paddingHorizontal: theme.spacing['sp-4'] },
  summary: { paddingVertical: 14, paddingHorizontal: theme.spacing['sp-4'] },
});

interface NativeDataTableProps<Row> extends DataTableProps<Row> {
  style?: StyleProp<ViewStyle>;
}

/**
 * Data table — zebra rows, no borders. Comfortable 64px rows by default. Below `stackBelow` px of
 * its **own** width it becomes one card per record; **it never scrolls horizontally**.
 *
 * **Three row states, and they are not the same thing.** `rowIssue` says a row is **broken**;
 * `rowResolved` says the caller accepted the fix; `isRowMuted` says done-and-inactive. And
 * `rowPending` is a fourth signal that is none of the three: an act in flight, which adds one line
 * and no tint, no dim and no disable — visibly pending **and still operable**.
 *
 * **`totalRow` is the one row that is not a record** and renders after the cards as well as under
 * the rows, so the figure the lines add up to cannot be sorted, paginated or stacked away.
 *
 * **The caption lives in the shell**, above both forms and every state message, and both forms
 * take their accessible name from it.
 */
export function DataTable<Row = Record<string, unknown>>(props: NativeDataTableProps<Row>) {
  const {
    columns,
    rows,
    rowKey = 'id',
    selectable = false,
    selected,
    onSelectionChange,
    bulkActions = null,
    sortable = false,
    sort,
    onSortChange,
    provenance,
    summary,
    state = 'ready',
    caption,
    continued = false,
    stackBelow = 640,
    onFormChange,
    page,
    pageSize = 10,
    rowCount,
    onPageChange,
    density = 'comfortable',
    style,
  } = props;

  const [ownWidth, setOwnWidth] = useState<number | null>(null);
  const { selection, setSelection, toggleRow, toggleAll, allSelected } = useTableSelection(
    selected,
    onSelectionChange,
    rows.length,
  );
  const { sort: activeSort, setSort } = useTableSort(sort, onSortChange);

  /* The table measures ITS OWN width — no layout in this system is tuned to a viewport. */
  const stacked = ownWidth !== null && ownWidth < stackBelow;
  const onLayout = (event: LayoutChangeEvent) => setOwnWidth(event.nativeEvent.layout.width);

  /* The breakpoint is the table's, so the answer is the table's to publish. The callback rides in
     a ref so a caller's inline arrow cannot turn "whenever the answer changes" into "every render"
     — and a caller that sets state in it into a loop. `Kanban` publishes its own the same way. */
  const formCb = useRef(onFormChange);
  useEffect(() => {
    formCb.current = onFormChange;
  }, [onFormChange]);
  useEffect(() => {
    if (ownWidth !== null) formCb.current?.({ stacked, width: ownWidth });
  }, [stacked, ownWidth]);

  const sorted = useMemo(() => sortRows(rows, columns, activeSort), [rows, columns, activeSort]);

  /* The table-wide statement, resolved: a caller may write a bare tier or a whole spec, and
     neither is a React child until `renderProvenance` has made one. */
  const tableProvenance = renderProvenance(provenance, { size: 12 });
  /* F7-27's link, in the shape RN has one: there is no `aria-labelledby`, so both forms carry the
     caption's WORDS as their own accessible name rather than pointing at the node that holds them. */
  const labelledBy =
    caption === undefined ? undefined : `${caption}${continued ? ' (continued)' : ''}`;

  if (showsMessage(state, rows.length)) {
    return (
      <View onLayout={onLayout} style={[styles.shell, style]}>
        <TableCaption caption={caption} continued={continued} />
        <TableStates table={props} stacked={stacked} density={density} />
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={[styles.shell, style]}>
      <TableCaption caption={caption} continued={continued} />

      {selectable && selection.length > 0 ? (
        <SelectionBar
          count={selection.length}
          actions={bulkActions}
          onClear={() => setSelection([])}
        />
      ) : null}

      {tableProvenance === null ? null : <View style={styles.band}>{tableProvenance}</View>}

      {/* M01-41's summary line. The words are the caller's: only they know what the rows are. */}
      {summary === undefined ? null : (
        <View style={styles.summary}>
          <Text variant="body-sm" color="secondary">
            {summary}
          </Text>
        </View>
      )}

      {stacked ? (
        <DataTableStacked
          rows={sorted}
          rowKey={rowKey}
          selectable={selectable}
          selected={selection}
          onToggleRow={toggleRow}
          labelledBy={labelledBy}
          table={props}
          pageSize={pageSize}
        />
      ) : (
        <DataTableGrid
          rows={sorted}
          rowKey={rowKey}
          selectable={selectable}
          selected={selection}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          allSelected={allSelected}
          sortable={sortable}
          sort={activeSort}
          onSort={setSort}
          labelledBy={labelledBy}
          table={props}
          pageSize={pageSize}
          density={density}
        />
      )}

      {typeof page === 'number' ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          rowCount={rowCount ?? rows.length}
          onPageChange={onPageChange}
        />
      ) : null}
    </View>
  );
}
