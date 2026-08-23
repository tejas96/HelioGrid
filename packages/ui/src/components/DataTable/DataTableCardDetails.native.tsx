import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { ProvenanceProps } from '../Provenance/Provenance.types';
import { alignOf } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { DataTableCell } from './DataTableCell.native';
import type { DataTableColumn } from './DataTableColumn.types';
import { ColumnTier } from './DataTableProvenance.native';

const styles = StyleSheet.create({
  list: { marginTop: 10, gap: theme.spacing['sp-2'] },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-4'],
  },
  pairWrap: { flexDirection: 'column', alignItems: 'stretch', gap: theme.spacing['sp-1'] },
  /* The tier is a sibling of the label, never a child of it — a View inside a Text does not lay
     out on RN, which is how a restored word would have gone missing again. */
  term: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
});

/**
 * One remaining column, as a label and its value. A `wrap` column takes the full card width with
 * its label above rather than beside it.
 */
function CardPair<Row>({
  row,
  column,
  table,
  tableSpec,
}: {
  row: Row;
  column: DataTableColumn<Row>;
  table: DataTableProps<Row>;
  tableSpec: ProvenanceProps | null;
}) {
  return (
    <View style={column.wrap === true ? styles.pairWrap : styles.pair}>
      <View style={styles.term}>
        <Text variant="caption" color="tertiary">
          {column.label}
        </Text>
        <ColumnTier column={column} tableSpec={tableSpec} />
      </View>
      <View>
        <DataTableCell
          row={row}
          column={column}
          align={alignOf(column)}
          cellIssue={table.cellIssue}
          onCellCommit={table.onCellCommit}
        />
      </View>
    </View>
  );
}

/** **Every column the card's named slots did not take**, as label/value pairs under the title. */
export function CardDetails<Row>({
  row,
  columns,
  table,
  tableSpec,
}: {
  row: Row;
  columns: DataTableColumn<Row>[];
  table: DataTableProps<Row>;
  /** The table-wide statement a column's tier is measured against, resolved once for the list. */
  tableSpec: ProvenanceProps | null;
}) {
  if (columns.length === 0) return null;
  return (
    <View style={styles.list}>
      {columns.map((column) => (
        <CardPair key={column.key} row={row} column={column} table={table} tableSpec={tableSpec} />
      ))}
    </View>
  );
}
