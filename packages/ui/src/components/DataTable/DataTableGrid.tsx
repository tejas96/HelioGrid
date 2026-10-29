import { rowKeysOf } from './DataTable.logic';
import type { GridProps } from './DataTable.parts.types';
import { DataTableHead } from './DataTableHead';
import { asProvenanceSpec } from './DataTableProvenance.logic';
import { DataTableRows } from './DataTableRows';
import { TotalFoot } from './DataTableTotal';

interface WebGridProps<Row> extends GridProps<Row> {
  /** The quiet head: the rows stand in one raised card under the labels. */
  quiet: boolean;
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
  quiet,
}: WebGridProps<Row>) {
  const { columns, rowActions, totalRow } = table;
  const hasActions = rowActions !== undefined;
  /* Resolved once for the whole header: the statement each column's tier is measured against. */
  const tableSpec = asProvenanceSpec(table.provenance);

  const grid = (
    <table className="hg-dt-table" aria-labelledby={labelledBy}>
      <DataTableHead
        columns={columns}
        selectable={selectable}
        allSelected={allSelected}
        onToggleAll={() => onToggleAll(rowKeysOf(rows, rowKey))}
        sortable={sortable}
        sort={sort}
        onSort={onSort}
        hasActions={hasActions}
        actionsLabel={table.actionsLabel}
        tableSpec={tableSpec}
        quiet={quiet}
        words={table.words}
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
          words={table.words}
        />
      )}
    </table>
  );
  /* Only a quiet table grows the wrapper its card is drawn in; every other table is unchanged. */
  return quiet ? <div className="hg-dt-quiet">{grid}</div> : grid;
}
