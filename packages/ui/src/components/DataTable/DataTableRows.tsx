import { rowKeyOf } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { DataTableBodyRow } from './DataTableBodyRow';
import { provenanceColumnOf } from './DataTableRow.logic';

export interface RowsProps<Row> {
  rows: Row[];
  columns: DataTableProps<Row>['columns'];
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
  table: DataTableProps<Row>;
}

/**
 * **The records, in order.** The body owns only what every row shares — the columns spanned by a
 * row's own line, and which cell carries the record's standing; everything a single record says is
 * `DataTableBodyRow`'s.
 *
 * **Three row states, and they are not the same thing.** `rowIssue` says a row is **broken** and is
 * fixed where it stands (warning tint, a sentence, the offending cell editable in place);
 * `rowResolved` says the caller accepted the fix; `isRowMuted` says done-and-inactive.
 *
 * **And `rowPending` is a fourth signal that is none of the three**: an act in flight. It adds one
 * line and no tint, no dim and no disable — the row must be visibly pending **and still operable**,
 * so its click target, checkbox, editors and actions all keep working. `aria-busy`, never
 * `aria-invalid`.
 */
export function DataTableRows<Row>({
  rows,
  columns,
  rowKey,
  selectable,
  selected,
  onToggleRow,
  table,
}: RowsProps<Row>) {
  const spanAll = (selectable ? 1 : 0) + columns.length + (table.rowActions === undefined ? 0 : 1);
  const provenanceColumn = provenanceColumnOf(columns);

  return (
    <tbody>
      {rows.map((row, index) => (
        <DataTableBodyRow
          key={rowKeyOf(rowKey, row, index)}
          row={row}
          index={index}
          columns={columns}
          rowKey={rowKey}
          selectable={selectable}
          selected={selected}
          onToggleRow={onToggleRow}
          provenanceColumn={provenanceColumn}
          spanAll={spanAll}
          table={table}
        />
      ))}
    </tbody>
  );
}
