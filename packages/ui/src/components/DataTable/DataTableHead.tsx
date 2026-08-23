import { Text } from '../../primitives/Text';
import { Checkbox } from '../Checkbox';
import type { ProvenanceProps } from '../Provenance';
import type { ColumnSortState } from './DataTable.logic';
import { alignOf, sortStateOf } from './DataTable.logic';
import type { DataTableProps, DataTableSort } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';
import { ColumnTier } from './DataTableProvenance';

function SortGlyph({ dir }: { dir: DataTableSort['dir'] | null }) {
  return (
    <svg
      className="hg-dt-sort-glyph"
      data-active={dir === null ? undefined : 'true'}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === 'desc' ? <path d="M3 5l3 3 3-3" /> : <path d="M3 7l3-3 3 3" />}
    </svg>
  );
}

/** **How the header announces its sort to a screen reader** — a sortable column always says which. */
function ariaSortOf(state: ColumnSortState): 'ascending' | 'descending' | 'none' | undefined {
  if (!state.active) return state.canSort ? 'none' : undefined;
  return state.dir === 'desc' ? 'descending' : 'ascending';
}

/**
 * **The column's name, in the system's overline.** It goes through the `Text` primitive rather
 * than through inherited cell CSS for the reason the native half does the same: this text IS the
 * header's accessible name, and a name that comes from CONTENT is the one thing no attribute
 * scan can see. Stated through the type primitive it is visible as a name source on both halves —
 * which is why `DataTableHead.native.tsx` may spell its own name out (RN has no `aria-sort`, so
 * the sort direction rides in the button's accessible name there) without that being drift.
 */
function ColumnName({ label, active }: { label: string; active: boolean }) {
  return (
    <Text as="span" variant="overline" color={active ? 'primary' : 'tertiary'}>
      {label}
    </Text>
  );
}

/**
 * **The cell itself carries no padding: its child does.** A child of a table cell can never fill
 * it, so the padding lives on the button or span and the whole header cell is the hit target.
 */
function HeadCell<Row>({
  column,
  state,
  index,
  columnCount,
  selectable,
  hasActions,
  onSort,
  tableSpec,
}: {
  column: DataTableColumn<Row>;
  state: ColumnSortState;
  index: number;
  columnCount: number;
  selectable: boolean;
  hasActions: boolean;
  onSort: (next: DataTableSort) => void;
  tableSpec: ProvenanceProps | null;
}) {
  return (
    <th
      className="hg-dt-th"
      scope="col"
      style={column.width === undefined ? undefined : { width: column.width }}
      data-align={alignOf(column)}
      data-first={index === 0 && !selectable ? 'true' : undefined}
      data-last={index === columnCount - 1 && !hasActions ? 'true' : undefined}
      aria-sort={ariaSortOf(state)}
    >
      {state.canSort ? (
        <button
          type="button"
          className="hg-dt-th-inner hg-dt-th-button"
          data-active={state.active ? 'true' : undefined}
          onClick={() => onSort(state.next)}
        >
          <ColumnName label={column.label} active={state.active} />
          <SortGlyph dir={state.dir} />
          <ColumnTier column={column} tableSpec={tableSpec} />
        </button>
      ) : (
        <span className="hg-dt-th-inner">
          <ColumnName label={column.label} active={false} />
          <ColumnTier column={column} tableSpec={tableSpec} />
        </span>
      )}
    </th>
  );
}

/**
 * Headers use the system's overline micro-label on white; the header separates from the rows by
 * luminance and weight, never by a rule.
 *
 * **The tier is a WORD in the header, not a dot with a tooltip** (`F8-07`).
 */
export function DataTableHead<Row>({
  columns,
  selectable,
  allSelected,
  onToggleAll,
  sortable,
  sort,
  onSort,
  hasActions,
  tableSpec,
}: {
  columns: DataTableProps<Row>['columns'];
  selectable: boolean;
  allSelected: boolean;
  onToggleAll: () => void;
  sortable: boolean;
  sort: DataTableSort | null | undefined;
  onSort: (next: DataTableSort) => void;
  hasActions: boolean;
  /** The table-wide statement a column's tier is measured against, resolved once by the grid. */
  tableSpec: ProvenanceProps | null;
}) {
  return (
    <thead className="hg-dt-head">
      <tr>
        {selectable ? (
          <th className="hg-dt-th hg-dt-th--select">
            <Checkbox
              className="hg-dt-tick"
              checked={allSelected}
              ariaLabel={allSelected ? 'Clear selection' : 'Select every row'}
              onChange={onToggleAll}
            />
          </th>
        ) : null}
        {columns.map((column, index) => (
          <HeadCell
            key={column.key}
            column={column}
            state={sortStateOf(column, sortable, sort)}
            index={index}
            columnCount={columns.length}
            selectable={selectable}
            hasActions={hasActions}
            onSort={onSort}
            tableSpec={tableSpec}
          />
        ))}
        {hasActions ? (
          <th className="hg-dt-th hg-dt-th--actions">
            <span className="hg-dt-sr">Actions</span>
          </th>
        ) : null}
      </tr>
    </thead>
  );
}
