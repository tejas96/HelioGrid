import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { FilterDimensionBlock } from './FilterDimension.native';
import {
  clearedFilterValue,
  countActiveFilters,
  filterHeaderLine,
  isFilterActive,
} from './FilterPanel.logic';
import type { FilterDimensionValue, FilterPanelProps, FilterSetProps } from './FilterPanel.types';

interface NativeFilterSetProps extends FilterSetProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeFilterPanelProps extends FilterPanelProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * **The one filter body, and it renders no chrome.** Nothing is staged: a change writes through
 * `onChange` immediately and the list behind updates.
 *
 * Platform mapping: the web half lays two columns out on a CSS grid; RN has none, so the
 * two-column form is a wrapping row of half-width blocks — the same two columns, same order.
 */
export function FilterSet({
  dimensions = [],
  value = {},
  onChange,
  columns = 1,
  onClear,
  showClear = true,
  header = true,
  style,
}: NativeFilterSetProps) {
  const n = countActiveFilters(dimensions, value);
  const setOne = (key: string, v: FilterDimensionValue) => onChange?.({ ...value, [key]: v });
  const clear = () => (onClear ? onClear() : onChange?.(clearedFilterValue(dimensions)));
  const two = columns > 1;
  return (
    <View style={[styles.set, style]}>
      {header ? (
        <View style={styles.header}>
          <Text variant="body-sm" color="secondary">
            {filterHeaderLine(n, dimensions.length)}
          </Text>
          {showClear && n > 0 ? (
            <Pressable onPress={clear} style={styles.clear}>
              <Text variant="body-sm" color="accent" style={styles.clearWords}>
                Clear all
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={two ? styles.gridTwo : styles.gridOne}>
        {dimensions.map((d) => (
          <View key={d.key} style={two ? styles.cellTwo : styles.cellOne}>
            <FilterDimensionBlock
              dim={d}
              value={value[d.key]}
              onChange={setOne}
              active={isFilterActive(d, value[d.key])}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * `FilterSet` inside an `EditorSurface`: a sheet below `panelAbove` of the layer's own width, a
 * side panel at or above it. The footer's primary action is a **labelled dismiss**, never an
 * apply — the filters are already on.
 */
export function FilterPanel({
  open = false,
  onClose,
  dimensions = [],
  value = {},
  onChange,
  onClear,
  title = 'Filters',
  resultCount,
  resultNoun = 'results',
  panelAbove = 720,
  width = 460,
  inset = false,
  zIndex = 40,
  style,
}: NativeFilterPanelProps) {
  const n = countActiveFilters(dimensions, value);
  const clear = () => (onClear ? onClear() : onChange?.(clearedFilterValue(dimensions)));
  const footer = (
    <View style={styles.footer}>
      <Pressable onPress={clear} disabled={n === 0} style={styles.footerClear}>
        <Text variant="body" color={n === 0 ? 'disabled' : 'primary'} style={styles.clearWords}>
          Clear all
        </Text>
      </Pressable>
      <Pressable onPress={onClose} style={styles.done}>
        <Text variant="body" color="inverse" style={styles.doneWords}>
          {typeof resultCount === 'number' ? `Show ${resultCount} ${resultNoun}` : 'Done'}
        </Text>
      </Pressable>
    </View>
  );
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      title={title}
      panelAbove={panelAbove}
      width={width}
      footer={footer}
      inset={inset}
      zIndex={zIndex}
      showClose
      style={style}
    >
      {({ panel }: { panel: boolean }) => (
        <FilterSet
          dimensions={dimensions}
          value={value}
          onChange={onChange}
          onClear={onClear}
          columns={panel ? 2 : 1}
        />
      )}
    </EditorSurface>
  );
}

FilterSet.countActive = countActiveFilters;
FilterSet.cleared = clearedFilterValue;
FilterSet.isActive = isFilterActive;
FilterPanel.Set = FilterSet;
FilterPanel.countActive = countActiveFilters;

const styles = StyleSheet.create({
  set: { flexDirection: 'column', gap: theme.spacing['sp-5'], minWidth: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-6'],
  },
  clear: { paddingHorizontal: 14, marginRight: -14 },
  clearWords: { fontWeight: '500' },
  gridOne: { flexDirection: 'column', gap: theme.spacing['sp-5'] },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 28,
    rowGap: theme.spacing['sp-6'],
  },
  cellOne: { minWidth: 0 },
  cellTwo: { flexBasis: '48%', flexGrow: 1, minWidth: 0 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  footerClear: { paddingHorizontal: theme.spacing['sp-4'], borderRadius: theme.radius['r-pill'] },
  /* A LABELLED DISMISS, never an apply. Primary actions are near-black — accent is never a fill. */
  done: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['action-primary'],
  },
  doneWords: { fontWeight: '500', letterSpacing: -0.15 },
});
