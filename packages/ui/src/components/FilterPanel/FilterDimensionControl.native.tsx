/* The control one dimension's KIND maps to (native) — the dispatch and the value each control
   wants, kept apart from the block's label, summary and hint. */

import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Checkbox } from '../Checkbox/Checkbox.native';
import { FacetChips, FilterChips } from '../FilterBar/FilterBar.native';
import { RangeField } from '../RangeField/RangeField.native';
import { facetDimensionValues, oneOfAllValue, rangeDimensionValue } from './FilterPanel.logic';
import type { FilterDimension, FilterDimensionValue } from './FilterPanel.types';

interface FilterDimensionControlProps {
  dim: FilterDimension;
  value: FilterDimensionValue;
  onChange: (key: string, value: FilterDimensionValue) => void;
}

/**
 * FOUR KINDS, AND EACH ONE IS AN EXISTING CONTROL, NOT A NEW LOOK:
 * facet → `FacetChips` · one-of → `FilterChips` · range → `RangeField` · flag → `Checkbox` in a
 * 44dp row, because a filter body is touched on a roof.
 */
export function FilterDimensionControl({ dim, value, onChange }: FilterDimensionControlProps) {
  if (dim.kind === 'facet') {
    return (
      <FacetChips
        label={dim.label}
        options={dim.options}
        counts={dim.counts}
        values={facetDimensionValues(value)}
        onChange={(v) => onChange(dim.key, v)}
      />
    );
  }
  if (dim.kind === 'one-of') {
    return (
      <FilterChips
        options={dim.options}
        counts={dim.counts}
        value={typeof value === 'string' ? value : oneOfAllValue(dim)}
        onChange={(v) => onChange(dim.key, v)}
      />
    );
  }
  if (dim.kind === 'range') {
    return (
      <RangeField
        value={rangeDimensionValue(value)}
        min={dim.min}
        max={dim.max}
        step={dim.step}
        unit={dim.unit}
        format={dim.format}
        hint={dim.hint}
        anyLabel={dim.anyLabel}
        onCommit={(v) => onChange(dim.key, v)}
      />
    );
  }
  if (dim.kind === 'flag') {
    return (
      <View style={styles.flag}>
        <Checkbox
          checked={value === true}
          label={dim.optionLabel || dim.label}
          onChange={(checked) => onChange(dim.key, checked)}
        />
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  flag: { flexDirection: 'row', alignItems: 'center', minHeight: 44, width: '100%' },
});
