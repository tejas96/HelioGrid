import { theme } from '@heliogrid/theme';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Checkbox } from '../Checkbox/Checkbox.native';
import type { ProvenanceProps } from '../Provenance/Provenance.types';
import type { ColumnSortState } from './DataTable.logic';
import { alignOf, DENSITY, sortStateOf } from './DataTable.logic';
import type { DataTableProps, DataTableSort } from './DataTable.types';
import { alignStyle, cellBox } from './DataTableCellShell.native';
import { tickPullback } from './DataTableChrome.native';
import type { DataTableColumn } from './DataTableColumn.types';
import { ColumnTier } from './DataTableProvenance.native';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  head: { backgroundColor: theme.colors.surface },
  headCell: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

function SortGlyph({ dir, active }: { dir: DataTableSort['dir'] | null; active: boolean }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none" opacity={active ? 1 : 0.35}>
      <Path
        d={dir === 'desc' ? 'M3 5l3 3 3-3' : 'M3 7l3-3 3 3'}
        stroke={theme.colors['text-tertiary']}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * **How the header announces its sort.** RN has no `aria-sort`, so the fact the web half puts on
 * the `<th>` (`DataTableHead.tsx:28-31`) rides in the button's own accessible name: which column
 * is sorted, and which way. Left to the glyph it would be direction by path and opacity — state by
 * shape and colour alone, which is `F7-12`.
 */
function sortedName(label: string, state: ColumnSortState): string {
  if (!state.active) return `${label}, not sorted`;
  return state.dir === 'desc' ? `${label}, sorted descending` : `${label}, sorted ascending`;
}

/** What pressing it does next — the same flip `state.next` carries. */
function sortHint(state: ColumnSortState): string {
  return state.next.dir === 'desc' ? 'Sorts descending' : 'Sorts ascending';
}

/**
 * One column's name, and the glyph saying which way it sorts. A sortable header is a button; a
 * fixed one is the same box without the press, so the header row keeps its rhythm either way.
 */
function HeadCell<Row>({
  column,
  state,
  gutter,
  onSort,
  tableSpec,
}: {
  column: DataTableColumn<Row>;
  state: ColumnSortState;
  gutter: number;
  onSort: (next: DataTableSort) => void;
  tableSpec: ProvenanceProps | null;
}) {
  const inner = (
    <View style={styles.headCell}>
      <Text variant="overline" color={state.active ? 'primary' : 'tertiary'}>
        {column.label}
      </Text>
      {state.canSort ? <SortGlyph dir={state.dir} active={state.active} /> : null}
      <ColumnTier column={column} tableSpec={tableSpec} />
    </View>
  );

  return (
    <View
      style={[cellBox(column.width), { paddingHorizontal: gutter }, alignStyle(alignOf(column))]}
    >
      {state.canSort ? (
        <RNPressable
          accessibilityRole="button"
          accessibilityLabel={sortedName(column.label, state)}
          accessibilityHint={sortHint(state)}
          onPress={() => onSort(state.next)}
        >
          {inner}
        </RNPressable>
      ) : (
        inner
      )}
    </View>
  );
}

/**
 * The wide form's header — the same overline micro-label the web half uses, separating from the
 * rows by luminance and weight rather than by a rule.
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
  density,
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
  density: NonNullable<DataTableProps<Row>['density']>;
  /** The table-wide statement a column's tier is measured against, resolved once by the grid. */
  tableSpec: ProvenanceProps | null;
}) {
  const spec = DENSITY[density];
  const gutter = { paddingHorizontal: spec.gutter };

  return (
    <View
      style={[
        styles.row,
        styles.head,
        { minHeight: spec.headH, paddingHorizontal: spec.edge - spec.gutter },
      ]}
    >
      {selectable ? (
        <View style={[{ width: spec.selW }, gutter]}>
          <Checkbox
            checked={allSelected}
            ariaLabel={allSelected ? 'Clear selection' : 'Select every row'}
            onChange={onToggleAll}
            style={tickPullback}
          />
        </View>
      ) : null}
      {columns.map((column) => (
        <HeadCell
          key={column.key}
          column={column}
          state={sortStateOf(column, sortable, sort)}
          gutter={spec.gutter}
          onSort={onSort}
          tableSpec={tableSpec}
        />
      ))}
      {hasActions ? <View style={[{ width: spec.actW }, gutter]} /> : null}
    </View>
  );
}
