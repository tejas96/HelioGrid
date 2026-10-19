import type { DataTableProps } from './DataTable.types';
import { ColumnName } from './DataTableHead';

/** The three placeholder rows a quiet table stands in for while its read is out (`SCR-M01-12`). */
const PLACEHOLDER_ROWS = ['a', 'b', 'c'] as const;

/**
 * **A quiet table's loading form keeps its labels and its card**, with three rows the height of the
 * rows they stand for, so nothing moves when the read lands (`SCR-M01-12`, `d-loading`). The table is
 * hidden from a screen reader: the shell is busy, and the caption names what is loading.
 */
export function QuietSkeleton<Row>({ table }: { table: DataTableProps<Row> }) {
  const { columns, rowActions } = table;
  const last = columns.length - 1;
  return (
    <div className="hg-dt-quiet" aria-busy="true">
      <table className="hg-dt-table" aria-hidden="true">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key}
                className="hg-dt-th"
                data-first={index === 0 ? 'true' : undefined}
                data-last={index === last && rowActions === undefined ? 'true' : undefined}
                data-align={column.align ?? (column.numeric ? 'right' : 'left')}
                style={column.width === undefined ? undefined : { width: column.width }}
              >
                <span className="hg-dt-th-inner">
                  <ColumnName label={column.label} active={false} quiet />
                </span>
              </th>
            ))}
            {rowActions === undefined ? null : <th className="hg-dt-th hg-dt-th--actions" />}
          </tr>
        </thead>
        <tbody>
          {PLACEHOLDER_ROWS.map((row) => (
            <tr key={row} className="hg-dt-row">
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className="hg-dt-cell-shell"
                  data-first={index === 0 ? 'true' : undefined}
                >
                  <span className="hg-dt-shimmer" data-w={index === 0 ? 'lead' : 'mid'} />
                </td>
              ))}
              {rowActions === undefined ? null : <td className="hg-dt-cell-shell" />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
