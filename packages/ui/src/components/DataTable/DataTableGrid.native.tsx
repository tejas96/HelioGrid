import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { rowKeysOf } from './DataTable.logic';
import type { GridProps } from './DataTable.parts.types';
import type { DataTableProps } from './DataTable.types';
import { DataTableRows } from './DataTableRows.native';
import { TotalBlock } from './DataTableTotal.native';

const styles = StyleSheet.create({
  totalFoot: {
    paddingHorizontal: theme.spacing['sp-4'],
    paddingTop: theme.spacing['sp-1'],
    paddingBottom: theme.spacing['sp-4'],
  },
});

interface NativeGridProps<Row> extends GridProps<Row> {
  density: NonNullable<DataTableProps<Row>['density']>;
}

/**
 * **The wide form** — header, records, and the one row that is not a record. The total renders
 * after the rows and again after the cards, so the figure the lines add up to cannot be sorted,
 * paginated or stacked away.
 */
export function DataTableGrid<Row>({
  rows,
  rowKey,
  selectable,
  selected,
  onToggleRow,
  onToggleAll,
  allSelected,
  sortable,
  sort,
  onSort,
  labelledBy,
  table,
  pageSize,
  density,
}: NativeGridProps<Row>) {
  const { columns, totalRow } = table;

  return (
    <>
      {/* THE GRID IS THE `<table>`, AND IT IS WHERE BOTH ITS ROLE AND ITS NAME BELONG — the web
          half writes `<table aria-labelledby>` on this very component. F7-27's caption names both
          forms, and a name needs something to hang on: a bare `View` carrying `accessibilityLabel`
          is not an accessibility element, so `role` is what makes this one expose the caption at
          all — the same pairing the stacked list uses (`accessibilityRole="list"` beside its
          label). */}
      <View role="table" accessibilityLabel={labelledBy}>
        <DataTableRows
          rows={rows}
          rowKey={rowKey}
          selectable={selectable}
          selected={selected}
          onToggleRow={onToggleRow}
          onToggleAll={() => onToggleAll(rowKeysOf(rows, rowKey))}
          allSelected={allSelected}
          sortable={sortable}
          sort={sort}
          onSort={onSort}
          table={table}
          density={density}
        />
      </View>
      {totalRow === undefined ? null : (
        <View style={styles.totalFoot}>
          <TotalBlock
            totalRow={totalRow}
            columns={columns}
            rowCount={table.rowCount}
            page={table.page}
            pageSize={pageSize}
            renderedRows={table.rows.length}
            words={table.words}
          />
        </View>
      )}
    </>
  );
}
