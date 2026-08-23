import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import { renderProvenance } from '../Provenance/Provenance.native';
import type { DataTableProps, DataTableTotalRow } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';
import { buildTotal } from './DataTableTotal.logic';

const styles = StyleSheet.create({
  block: {
    flexDirection: 'column',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-4'],
  },
  figure: { fontWeight: '700', letterSpacing: -0.36 },
  label: { fontWeight: '700', letterSpacing: -0.14 },
});

interface TotalProps<Row> {
  totalRow: DataTableTotalRow;
  columns: DataTableColumn<Row>[];
  rowCount: DataTableProps<Row>['rowCount'];
  page: DataTableProps<Row>['page'];
  pageSize: number;
  renderedRows: number;
}

/**
 * **The one row that is not a record**, on the phone. It is not a card — a total is not a record,
 * so it takes neither the card's shape nor its row target. It is the table's own last line, in the
 * same words as the wide form, and it **cannot stack away** (`F7-31`), **cannot sort** (sorting
 * only touches `rows`) and **cannot paginate away** (it is not one of `rows`).
 *
 * A disagreement with `reconcile` renders in danger words naming the gap: a defect, not a display
 * difference (`SCR-M06-14`). The row still states its own sum.
 */
export function TotalBlock<Row>({
  totalRow,
  columns,
  rowCount,
  page,
  pageSize,
  renderedRows,
}: TotalProps<Row>) {
  /* The market pack's money, read here and threaded into the model — every figure this row states
     is the same figure, formatted the same way, as the lines above it (`F1` / `F3-20`). */
  const model = buildTotal(totalRow, rowCount, page, pageSize, renderedRows, useFormat());
  /* The same columns the wide row states, with the column's own label — nothing here invents a
     second vocabulary for the same total. */
  const stated = columns.filter((column) => totalRow.values?.[column.key] !== undefined);
  const main = stated[stated.length - 1];

  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <Text variant="body" style={styles.label}>
          {totalRow.label}
        </Text>
        {main === undefined ? null : (
          <Text variant="mono" style={styles.figure}>
            {model.valueFor(main as DataTableColumn<unknown>)}
          </Text>
        )}
      </View>
      {model.scope === null ? null : (
        <Text variant="caption" color="secondary">
          {model.scope}
        </Text>
      )}
      {stated.slice(0, -1).map((column) => (
        <View key={column.key} style={styles.pair}>
          <Text variant="caption" color="tertiary">
            {column.label}
          </Text>
          <Text variant="mono">{model.valueFor(column as DataTableColumn<unknown>)}</Text>
        </View>
      ))}
      {/* A DISAGREEMENT IS A DEFECT, NOT A DISPLAY DIFFERENCE (`SCR-M06-14`), so it is announced
          as one. The web half gives this sentence `role="alert"`; a plain `<Text>` here left the
          one fact the total exists to guard silent to a screen reader on the phone. */}
      {model.defectNote === null ? null : (
        <View accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Text variant="body-sm" color="danger" style={{ fontWeight: '500' }}>
            {model.defectNote}
          </Text>
        </View>
      )}
      {model.defectNote === null && model.agreeNote !== null ? (
        <Text variant="caption" color="secondary">
          {model.agreeNote}
        </Text>
      ) : null}
      {renderProvenance(totalRow.provenance, { size: 12 })}
      {totalRow.note === undefined ? null : (
        <Text variant="caption" color="secondary">
          {totalRow.note}
        </Text>
      )}
    </View>
  );
}
