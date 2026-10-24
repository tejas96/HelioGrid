import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { FilterSection } from './FilterDimension.native';
import { FilterDimensionControl } from './FilterDimensionControl.native';
import {
  clearedFilterValue,
  countActiveFilters,
  filterLayout,
  isFilterActive,
  withDimension,
} from './FilterPanel.logic';
import type { FilterDimensionValue, FilterPanelProps, FilterSetProps } from './FilterPanel.types';

interface NativeFilterSetProps extends FilterSetProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeFilterPanelProps extends FilterPanelProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * **The one filter body, and it renders no chrome.** One column of sections at every width, a
 * hairline between; every flag a `Switch` row in a last *Show* section. Nothing is staged: a
 * change writes through `onChange` immediately — with every folded dimension whose value is no
 * longer chosen cleared in the same write.
 */
export function FilterSet({
  dimensions = [],
  value = {},
  onChange,
  words,
  style,
}: NativeFilterSetProps) {
  const setOne = (key: string, v: FilterDimensionValue) =>
    onChange?.(withDimension(dimensions, value, key, v));
  const { sections, flags } = filterLayout(dimensions, value);
  const parted = (index: number) => (index === 0 ? styles.first : styles.parted);
  return (
    <View style={[styles.set, style]}>
      {sections.map(({ dim, folds }, index) => (
        <View key={dim.key} style={[styles.section, parted(index)]}>
          <FilterSection dim={dim} folds={folds} value={value} onChange={setOne} words={words} />
        </View>
      ))}
      {flags.length === 0 ? null : (
        <View style={[styles.section, styles.flags, parted(sections.length)]}>
          <Text variant="overline" color="tertiary">
            {words.show}
          </Text>
          {flags.map((dim) => (
            <View key={dim.key}>
              <FilterDimensionControl
                dim={dim}
                value={value[dim.key]}
                onChange={setOne}
                words={words}
              />
              {dim.hint ? (
                <Text variant="caption" color="tertiary">
                  {dim.hint}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * `FilterSet` inside an `EditorSurface`: a sheet below `panelAbove` of the layer's own width, a
 * side panel at or above it — the same one column in both. *Clear all* shows once, here in the
 * footer. The footer's primary action is a **labelled dismiss**, never an apply — the filters are
 * already on.
 */
export function FilterPanel({
  open = false,
  onClose,
  closeLabel,
  dimensions = [],
  value = {},
  onChange,
  onClear,
  words,
  showClear = true,
  resultCount,
  resultNoun,
  panelAbove = 720,
  width = 460,
  inset = false,
  modal = true,
  zIndex = 40,
  style,
}: NativeFilterPanelProps) {
  const n = countActiveFilters(dimensions, value);
  const clear = () => (onClear ? onClear() : onChange?.(clearedFilterValue(dimensions)));
  const footer = (
    <View style={styles.footer}>
      {showClear ? (
        <Pressable onPress={clear} disabled={n === 0} style={styles.footerClear}>
          <Text variant="body" color={n === 0 ? 'disabled' : 'primary'} style={styles.clearWords}>
            {words.clearAll}
          </Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onClose} style={styles.done}>
        <Text variant="body" color="inverse" style={styles.doneWords}>
          {typeof resultCount === 'number'
            ? words.showResults(resultCount, resultNoun)
            : words.done}
        </Text>
      </Pressable>
    </View>
  );
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={closeLabel}
      title={words.title}
      panelAbove={panelAbove}
      width={width}
      footer={footer}
      inset={inset}
      modal={modal}
      zIndex={zIndex}
      showClose
      style={style}
    >
      <FilterSet dimensions={dimensions} value={value} onChange={onChange} words={words} />
    </EditorSurface>
  );
}

FilterSet.countActive = countActiveFilters;
FilterSet.cleared = clearedFilterValue;
FilterSet.isActive = isFilterActive;
FilterPanel.Set = FilterSet;
FilterPanel.countActive = countActiveFilters;

const styles = StyleSheet.create({
  set: { flexDirection: 'column', minWidth: 0 },
  section: { paddingVertical: theme.spacing['sp-5'], minWidth: 0 },
  first: { paddingTop: 0 },
  /* A hairline between sections, never a box around one — a section is a heading, not a tile. */
  parted: { borderTopWidth: 1, borderTopColor: theme.colors['line-soft'] },
  flags: { flexDirection: 'column', gap: theme.spacing['sp-3'] },
  clearWords: { fontWeight: '500' },
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
