import type { ProvenanceProps } from '../Provenance';
import { alignOf } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { DataTableCell } from './DataTableCell';
import type { DataTableColumn } from './DataTableColumn.types';
import { ColumnTier } from './DataTableProvenance';
import { isTappable } from './DataTableStacked.logic';

/**
 * One remaining column, as a label and its value. A `wrap` column takes the full card width with
 * its label above rather than beside it — twelve role chips in a value column would be twelve
 * lines.
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
    <div className="hg-dt-card-pair" data-wrap={column.wrap === true ? 'true' : undefined}>
      <dt>
        {column.label}
        <ColumnTier column={column} tableSpec={tableSpec} />
      </dt>
      <dd
        data-mono={column.mono === true || column.numeric === true ? 'true' : undefined}
        data-numeric={column.numeric === true ? 'true' : undefined}
        data-editable={
          column.editable === true && table.onCellCommit !== undefined ? 'true' : undefined
        }
        data-tappable={isTappable(column, table, true) ? 'true' : undefined}
      >
        <DataTableCell
          row={row}
          column={column}
          align={alignOf(column)}
          cellIssue={table.cellIssue}
          onCellCommit={table.onCellCommit}
        />
      </dd>
    </div>
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
    <dl className="hg-dt-card-list">
      {columns.map((column) => (
        <CardPair key={column.key} row={row} column={column} table={table} tableSpec={tableSpec} />
      ))}
    </dl>
  );
}
