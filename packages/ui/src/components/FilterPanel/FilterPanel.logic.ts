import { optionValue } from '../FilterBar/FilterBar.types';
import { rangeIsAny } from '../RangeField/RangeField.logic';
import type { RangeValue } from '../RangeField/RangeField.types';
import type {
  FilterDimension,
  FilterDimensionValue,
  FilterValue,
  OneOfDimension,
} from './FilterPanel.types';

/** The value a `one-of` dimension holds when it is doing nothing — its declared "all", else the
 *  first option. */
export function oneOfAllValue(dim: OneOfDimension): string | undefined {
  if (dim.allValue !== undefined) return dim.allValue;
  const first = dim.options[0];
  return first === undefined ? undefined : optionValue(first);
}

/** The values a `facet` dimension hands `FacetChips` — the stored list, strings only. */
export function facetDimensionValues(value: FilterDimensionValue): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** The two ends a `range` dimension hands `RangeField` — `null` when it holds no pair of numbers. */
export function rangeDimensionValue(value: FilterDimensionValue): RangeValue | null {
  if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
    return [value[0], value[1]];
  }
  return null;
}

/** A stored range is a pair of numbers or nothing at all; anything else is not a range. */
function asRange(value: FilterDimensionValue): RangeValue | null {
  return Array.isArray(value) && value.length === 2 ? rangeDimensionValue(value) : null;
}

/** Whether one dimension is doing anything. This is also what the counter counts. */
export function isFilterActive(dim: FilterDimension, value: FilterDimensionValue): boolean {
  switch (dim.kind) {
    case 'facet':
      return Array.isArray(value) && value.length > 0;
    case 'one-of':
      return value !== null && value !== undefined && value !== oneOfAllValue(dim);
    case 'range':
      return !rangeIsAny(asRange(value), dim.min, dim.max);
    case 'flag':
      return value === true;
  }
}

/** How many dimensions are doing something. Feed this to `FiltersButton`'s `count`. */
export function countActiveFilters(
  dimensions: FilterDimension[] = [],
  value: FilterValue = {},
): number {
  return dimensions.reduce((n, d) => n + (isFilterActive(d, value[d.key]) ? 1 : 0), 0);
}

/**
 * Every dimension at its inactive value — THE ONE PLACE THAT KNOWS WHAT "OFF" MEANS PER KIND.
 * Never hand-write a reset object.
 */
export function clearedFilterValue(dimensions: FilterDimension[] = []): FilterValue {
  const out: FilterValue = {};
  for (const d of dimensions) {
    if (d.kind === 'facet') out[d.key] = [];
    else if (d.kind === 'one-of') out[d.key] = oneOfAllValue(d);
    else if (d.kind === 'range') out[d.key] = null;
    else out[d.key] = false;
  }
  return out;
}

/** The header's own sentence, so both platform halves count and word it identically. */
export function filterHeaderLine(active: number, total: number): string {
  return active === 0 ? 'No filters on' : `${active} of ${total} filters on`;
}
