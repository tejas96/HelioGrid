import { Text } from '../../primitives/Text';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { Checkbox } from '../Checkbox';
import type { ProvenanceProps } from '../Provenance';
import type { ColumnSortState } from './DataTable.logic';
import { alignOf, selectAllLabelOf, sortGlyphOf, sortStateOf } from './DataTable.logic';
import type { DataTableProps, DataTableSort, DataTableWords } from './DataTable.types';
import type { DataTableColumn } from './DataTableColumn.types';
import { ColumnTier } from './DataTableProvenance';

function SortGlyph({ dir }: { dir: DataTableSort['dir'] | null }) {
  return (
    <svg
      className="hg-dt-sort-glyph"
      data-active={dir === null ? undefined : 'true'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ShellGlyphMarks name={sortGlyphOf(dir)} />
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
export function ColumnName({
  label,
  active,
  quiet,
}: {
  label: string;
  active: boolean;
  /** The quiet head's sentence-case caption (design-system change 20) instead of the overline. */
  quiet: boolean;
}) {
  const rest = quiet ? 'secondary' : 'tertiary';
  return (
    <Text as="span" variant={quiet ? 'caption' : 'overline'} color={active ? 'primary' : rest}>
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
  quiet,
}: {
  column: DataTableColumn<Row>;
  state: ColumnSortState;
  index: number;
  columnCount: number;
  selectable: boolean;
  hasActions: boolean;
  onSort: (next: DataTableSort) => void;
  tableSpec: ProvenanceProps | null;
  quiet: boolean;
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
          <ColumnName label={column.label} active={state.active} quiet={quiet} />
          <SortGlyph dir={state.dir} />
          <ColumnTier column={column} tableSpec={tableSpec} />
        </button>
      ) : (
        <span className="hg-dt-th-inner">
          <ColumnName label={column.label} active={false} quiet={quiet} />
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
  actionsLabel,
  tableSpec,
  quiet = false,
  words,
}: {
  columns: DataTableProps<Row>['columns'];
  selectable: boolean;
  allSelected: boolean;
  onToggleAll: () => void;
  sortable: boolean;
  sort: DataTableSort | null | undefined;
  onSort: (next: DataTableSort) => void;
  hasActions: boolean;
  actionsLabel?: string;
  /** The table-wide statement a column's tier is measured against, resolved once by the grid. */
  tableSpec: ProvenanceProps | null;
  /** The quiet head (design-system change 20). */
  quiet?: boolean;
  words: DataTableWords;
}) {
  return (
    <thead className="hg-dt-head">
      <tr>
        {selectable ? (
          <th className="hg-dt-th hg-dt-th--select">
            <Checkbox
              className="hg-dt-tick"
              checked={allSelected}
              ariaLabel={selectAllLabelOf(allSelected, words)}
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
            quiet={quiet}
          />
        ))}
        {hasActions ? (
          <th className="hg-dt-th hg-dt-th--actions">
            <span className="hg-spoken-only">{actionsLabel}</span>
          </th>
        ) : null}
      </tr>
    </thead>
  );
}
