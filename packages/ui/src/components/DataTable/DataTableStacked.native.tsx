import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { rowKeyOf } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { DataTableCard } from './DataTableCard.native';
import { asProvenanceSpec } from './DataTableProvenance.logic';
import { resolveStackedColumns } from './DataTableStacked.logic';
import { TotalBlock } from './DataTableTotal.native';

const styles = StyleSheet.create({
  list: { padding: 10, gap: 10 },
  totalFoot: {
    paddingHorizontal: theme.spacing['sp-4'],
    paddingTop: theme.spacing['sp-1'],
    paddingBottom: theme.spacing['sp-4'],
  },
});

export interface StackedProps<Row> {
  rows: Row[];
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
  /**
   * **The caption's words** (`F7-27`). RN has no `aria-labelledby`, so the caption cannot be
   * pointed at by id — the equivalent is carrying its text as the list's own accessible name, and
   * without it the list announces as an unnamed collection of rows.
   */
  labelledBy?: string;
  table: DataTableProps<Row>;
  pageSize: number;
}

/**
 * The phone answer: one card per record. The list owns only what every card shares — which column
 * plays which part, and the total that must not stack away; everything one record says is
 * `DataTableCard`'s.
 */
export function DataTableStacked<Row>({
  rows,
  rowKey,
  selectable,
  selected,
  onToggleRow,
  labelledBy,
  table,
  pageSize,
}: StackedProps<Row>) {
  const { columns } = table;
  const slots = resolveStackedColumns(columns);
  const primary = slots.primary;
  /* Resolved once for the whole list: the statement each column's tier is measured against. */
  const tableSpec = asProvenanceSpec(table.provenance);

  if (primary === undefined) return null;

  return (
    <>
      <View accessibilityRole="list" accessibilityLabel={labelledBy} style={styles.list}>
        {rows.map((row, index) => (
          <DataTableCard
            key={rowKeyOf(rowKey, row, index)}
            row={row}
            index={index}
            rowKey={rowKey}
            selectable={selectable}
            selected={selected}
            onToggleRow={onToggleRow}
            slots={{ ...slots, primary }}
            table={table}
            tableSpec={tableSpec}
          />
        ))}
      </View>
      {/* THE TOTAL ON THE PHONE — it must not stack away (F7-31). */}
      {table.totalRow === undefined ? null : (
        <View style={styles.totalFoot}>
          <TotalBlock
            totalRow={table.totalRow}
            columns={columns}
            rowCount={table.rowCount}
            page={table.page}
            pageSize={pageSize}
            renderedRows={rows.length}
          />
        </View>
      )}
    </>
  );
}
