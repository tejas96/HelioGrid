import { rowKeyOf } from './DataTable.logic';
import type { DataTableProps, DataTableSort } from './DataTable.types';
import { DataTableHead } from './DataTableHead';
import { asProvenanceSpec } from './DataTableProvenance.logic';
import { DataTableRows } from './DataTableRows';
import { TotalFoot } from './DataTableTotal';

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
  labelledBy?: string;
  table: DataTableProps<Row>;
  pageSize: number;
}

/**
 * **The wide form** — header, records, and the one row that is not a record. `totalRow` lives in
 * `<tfoot>`, which is what makes its three prohibitions structural rather than remembered: it
 * cannot sort, cannot paginate away and cannot stack away.
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
}: GridProps<Row>) {
  const { columns, rowActions, totalRow } = table;
  const hasActions = rowActions !== undefined;
  /* Resolved once for the whole header: the statement each column's tier is measured against. */
  const tableSpec = asProvenanceSpec(table.provenance);

  return (
    <table className="hg-dt-table" aria-labelledby={labelledBy}>
      <DataTableHead
        columns={columns}
        selectable={selectable}
        allSelected={allSelected}
        onToggleAll={() => onToggleAll(rows.map((row, index) => rowKeyOf(rowKey, row, index)))}
        sortable={sortable}
        sort={sort}
        onSort={onSort}
        hasActions={hasActions}
        tableSpec={tableSpec}
      />
      <DataTableRows
        rows={rows}
        columns={columns}
        rowKey={rowKey}
        selectable={selectable}
        selected={selected}
        onToggleRow={onToggleRow}
        table={table}
      />
      {totalRow === undefined ? null : (
        <TotalFoot
          totalRow={totalRow}
          columns={columns}
          selectable={selectable}
          hasActions={hasActions}
          rowCount={table.rowCount}
          page={table.page}
          pageSize={pageSize}
          renderedRows={table.rows.length}
        />
      )}
    </table>
  );
}
