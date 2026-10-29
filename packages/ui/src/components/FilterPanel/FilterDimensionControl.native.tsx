/* The control one dimension's KIND maps to (native) — the dispatch and the value each control
   wants, kept apart from the section's name, summary and hint. */

import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Button } from '../Button/Button.native';
import { FacetChips, FilterChips } from '../FilterBar/FilterBar.native';
import { RangeField } from '../RangeField/RangeField.native';
import { Switch } from '../Switch/Switch.native';
import { chosenChips, rangeDimensionValue, shownChipOptions } from './FilterPanel.logic';
import type { FilterDimensionControlProps } from './FilterPanel.types';

/**
 * FOUR KINDS, AND EACH ONE IS AN EXISTING CONTROL, NOT A NEW LOOK:
 * facet → `FacetChips` · one-of → `FilterChips` · range → `RangeField` · flag → a `Switch` row,
 * 44dp tall, because a filter body is touched on a roof. A chip list longer than six shows six
 * and any chosen one, then *Show all N <noun>*.
 */
export function FilterDimensionControl({
  dim,
  value,
  onChange,
  words,
}: FilterDimensionControlProps) {
  const [showAll, setShowAll] = useState(false);
  if (dim.kind === 'facet' || dim.kind === 'one-of') {
    const chosen = chosenChips(dim, value);
    const { shown, capped } = shownChipOptions(dim.options, chosen, showAll);
    return (
      <View style={styles.chips}>
        {dim.kind === 'facet' ? (
          <FacetChips
            label={dim.label}
            selectedLabel={words.selectedTick}
            options={shown}
            counts={dim.counts}
            values={chosen}
            onChange={(v) => onChange(dim.key, v)}
          />
        ) : (
          <FilterChips
            label={dim.label}
            options={shown}
            counts={dim.counts}
            value={chosen[0]}
            onChange={(v) => onChange(dim.key, v)}
          />
        )}
        {capped ? (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
            {words.showAll(dim.options.length, dim.noun)}
          </Button>
        ) : null}
      </View>
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
        boxLabels={words.rangeEnds}
        onCommit={(v) => onChange(dim.key, v)}
      />
    );
  }
  return (
    <View style={styles.flag}>
      <Switch
        checked={value === true}
        label={dim.optionLabel ?? dim.label}
        onChange={(checked) => onChange(dim.key, checked)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'column', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  flag: { flexDirection: 'row', alignItems: 'center', minHeight: 44, width: '100%' },
});
