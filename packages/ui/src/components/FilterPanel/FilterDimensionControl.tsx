/* The control one dimension's KIND maps to (web) — the dispatch and the value each control wants,
   kept apart from the section's name, summary and hint. */

import { useState } from 'react';
import { Button } from '../Button';
import { FacetChips, FilterChips } from '../FilterBar';
import { RangeField } from '../RangeField';
import { Switch } from '../Switch';
import { chosenChips, rangeDimensionValue, shownChipOptions } from './FilterPanel.logic';
import type { FilterDimensionControlProps } from './FilterPanel.types';

/**
 * FOUR KINDS, AND EACH ONE IS AN EXISTING CONTROL, NOT A NEW LOOK:
 * facet → `FacetChips` (several values) · one-of → `FilterChips` (exactly one) ·
 * range → `RangeField` (two ends) · flag → a `Switch` row, 44px tall.
 * A chip list longer than six shows six and any chosen one, then *Show all N <noun>*.
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
      <div className="hg-filter-chip-list">
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
      </div>
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
    <div className="hg-filter-flag">
      <Switch
        checked={value === true}
        label={dim.optionLabel ?? dim.label}
        onChange={(checked) => onChange(dim.key, checked)}
      />
    </div>
  );
}
