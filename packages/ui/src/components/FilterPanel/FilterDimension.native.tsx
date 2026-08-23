import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Text } from '../../primitives/Text/Text.native';
import { FilterDimensionControl } from './FilterDimensionControl.native';
import type { FilterDimension, FilterDimensionValue } from './FilterPanel.types';

interface FilterDimensionBlockProps {
  dim: FilterDimension;
  value: FilterDimensionValue;
  onChange: (key: string, value: FilterDimensionValue) => void;
  active: boolean;
}

/**
 * ONE LABELLED DIMENSION: its name, the "n selected" summary a facet earns, the control its kind
 * maps to (`FilterDimensionControl`) and the hint no control of its own already carries.
 */
export function FilterDimensionBlock({ dim, value, onChange, active }: FilterDimensionBlockProps) {
  const summary =
    dim.kind === 'facet' && active && Array.isArray(value) ? `${value.length} selected` : null;
  return (
    <View style={styles.dimension}>
      <View style={styles.head}>
        <Text variant="overline" color="tertiary">
          {dim.label}
        </Text>
        {summary ? (
          <Text variant="caption" color="secondary">
            {summary}
          </Text>
        ) : null}
      </View>
      <FilterDimensionControl dim={dim} value={value} onChange={onChange} />
      {dim.kind !== 'range' && dim.hint ? (
        <Text variant="caption" color="tertiary">
          {dim.hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /* The 10dp gap has no step on the 4dp scale — it is the DS's own filter-body rhythm. */
  dimension: { flexDirection: 'column', gap: 10, minWidth: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
});
