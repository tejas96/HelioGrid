import { rowKeyOf } from './DataTable.logic';
import type { DataTableProps } from './DataTable.types';
import { DataTableCard } from './DataTableCard';
import { asProvenanceSpec } from './DataTableProvenance.logic';
import { resolveStackedColumns } from './DataTableStacked.logic';
import { TotalBlock } from './DataTableTotal';

export interface StackedProps<Row> {
  rows: Row[];
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
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
      <ul className="hg-dt-cards" aria-labelledby={labelledBy}>
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
      </ul>
      {/* THE TOTAL ON THE PHONE — it must not stack away (F7-31). */}
      {table.totalRow === undefined ? null : (
        <div className="hg-dt-total-foot" data-flow-foot="" data-keep-together="">
          <TotalBlock
            totalRow={table.totalRow}
            columns={columns}
            rowCount={table.rowCount}
            page={table.page}
            pageSize={pageSize}
            renderedRows={rows.length}
          />
        </div>
      )}
    </>
  );
}
