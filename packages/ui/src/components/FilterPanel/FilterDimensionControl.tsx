/* The control one dimension's KIND maps to (web) — the dispatch and the value each control wants,
   kept apart from the block's label, summary and hint. */

import { Checkbox } from '../Checkbox';
import { FacetChips, FilterChips } from '../FilterBar';
import { RangeField } from '../RangeField';
import { facetDimensionValues, oneOfAllValue, rangeDimensionValue } from './FilterPanel.logic';
import type { FilterDimension, FilterDimensionValue } from './FilterPanel.types';

interface FilterDimensionControlProps {
  dim: FilterDimension;
  value: FilterDimensionValue;
  onChange: (key: string, value: FilterDimensionValue) => void;
}

/**
 * FOUR KINDS, AND EACH ONE IS AN EXISTING CONTROL, NOT A NEW LOOK:
 * facet → `FacetChips` (several values) · one-of → `FilterChips` (exactly one) ·
 * range → `RangeField` (two ends) · flag → `Checkbox` in a 44px row.
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
      <div className="hg-filter-dimension-flag">
        <Checkbox
          checked={value === true}
          label={dim.optionLabel || dim.label}
          onChange={(checked) => onChange(dim.key, checked)}
        />
      </div>
    );
  }
  return null;
}
