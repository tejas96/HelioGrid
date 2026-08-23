import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { rowKeyOf } from './DataTable.logic';
import type { DataTableProps, DataTableSort } from './DataTable.types';
import { DataTableRows } from './DataTableRows.native';
import { TotalBlock } from './DataTableTotal.native';

const styles = StyleSheet.create({
  totalFoot: {
    paddingHorizontal: theme.spacing['sp-4'],
    paddingTop: theme.spacing['sp-1'],
    paddingBottom: theme.spacing['sp-4'],
  },
});

export interface GridProps<Row> {
  /** The rows in the order they render — sorting has already happened. */
  rows: Row[];
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
  onToggleAll: (keys: (string | number)[]) => void;
  allSelected: boolean;
  sortable: boolean;
  sort: DataTableSort | null | undefined;
  onSort: (next: DataTableSort) => void;
  /**
   * **The caption's words** (`F7-27`). RN has no `aria-labelledby`, so the caption cannot be
   * pointed at by id — the equivalent is carrying its text as the grid's own accessible name.
   */
  labelledBy?: string;
  table: DataTableProps<Row>;
  pageSize: number;
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
}: GridProps<Row>) {
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
          onToggleAll={() => onToggleAll(rows.map((row, index) => rowKeyOf(rowKey, row, index)))}
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
          />
        </View>
      )}
    </>
  );
}
