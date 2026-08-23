import { DENSITY, rowKeyOf } from './DataTable.logic';
import type { DataTableProps, DataTableSort } from './DataTable.types';
import { DataTableBodyRow } from './DataTableBodyRow.native';
import { DataTableHead } from './DataTableHead.native';
import { asProvenanceSpec } from './DataTableProvenance.logic';
import { provenanceColumnOf } from './DataTableRow.logic';

export interface NativeRowsProps<Row> {
  rows: Row[];
  rowKey: NonNullable<DataTableProps<Row>['rowKey']>;
  selectable: boolean;
  selected: (string | number)[];
  onToggleRow: (key: string | number) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  sortable: boolean;
  sort: DataTableSort | null | undefined;
  onSort: (next: DataTableSort) => void;
  table: DataTableProps<Row>;
  density: NonNullable<DataTableProps<Row>['density']>;
}

/**
 * The wide form on a tablet: a flex grid of rows, sized by `column.width` where the caller gave
 * one and shared evenly otherwise. **It never scrolls sideways** — below `stackBelow` the table is
 * already a list of cards, so this form only ever runs where the columns fit.
 *
 * **Three row states, and `rowPending` is not one of them.** `rowIssue` says BROKEN, `rowResolved`
 * says the caller accepted the fix, `isRowMuted` says done-and-inactive; pending adds a line and
 * changes nothing else, because the row must be visibly pending **and still operable**.
 */
export function DataTableRows<Row>({
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
  table,
  density,
}: NativeRowsProps<Row>) {
  const { columns } = table;
  const spec = DENSITY[density];
  const provenanceColumn = provenanceColumnOf(columns);
  /* Resolved once for the whole header: the statement each column's tier is measured against. */
  const tableSpec = asProvenanceSpec(table.provenance);

  return (
    /* THE GRID'S ROLE AND ITS NAME LIVE ONE LEVEL UP, on `DataTableGrid.native`, exactly where the
       web half puts them: `<table aria-labelledby>` is the GRID, not its body. This file is the
       `<thead>` + `<tbody>` inside it and declares nothing of its own — the same split as
       `DataTableRows.tsx`, whose `<tbody>` is likewise silent. */
    <>
      <DataTableHead
        columns={columns}
        selectable={selectable}
        allSelected={allSelected}
        onToggleAll={onToggleAll}
        sortable={sortable}
        sort={sort}
        onSort={onSort}
        hasActions={table.rowActions !== undefined}
        density={density}
        tableSpec={tableSpec}
      />
      {rows.map((row, index) => (
        <DataTableBodyRow
          key={rowKeyOf(rowKey, row, index)}
          row={row}
          index={index}
          rowKey={rowKey}
          selectable={selectable}
          selected={selected}
          onToggleRow={onToggleRow}
          provenanceColumn={provenanceColumn}
          spec={spec}
          table={table}
        />
      ))}
    </>
  );
}
