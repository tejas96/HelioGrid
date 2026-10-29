import type { TranslatedText } from '@heliogrid/contracts';
import type { FilterOption } from '../FilterBar/FilterBar.types';
import { optionLabel, optionValue } from '../FilterBar/FilterBar.types';
import { rangeIsAny, rangeReadout } from '../RangeField/RangeField.logic';
import type { RangeValue } from '../RangeField/RangeField.types';
import type {
  FacetDimension,
  FilterDimension,
  FilterDimensionUnder,
  FilterDimensionValue,
  FilterFold,
  FilterPanelWords,
  FilterSetWords,
  FilterValue,
  FlagDimension,
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

/** Whether the value a folded dimension belongs to is chosen now. */
export function underIsChosen(under: FilterDimensionUnder, value: FilterValue): boolean {
  const held = value[under.key];
  return Array.isArray(held) ? held.some((v) => v === under.value) : held === under.value;
}

/**
 * One dimension changed, and every dimension that belonged to a value no longer chosen is cleared
 * with it: a folded filter that is hidden but still on would narrow the list for a reason nobody
 * can see. Runs until nothing more clears, so a chain of folds clears all the way down.
 */
export function withDimension(
  dimensions: FilterDimension[],
  value: FilterValue,
  key: string,
  next: FilterDimensionValue,
): FilterValue {
  let out: FilterValue = { ...value, [key]: next };
  let changed = true;
  while (changed) {
    changed = false;
    for (const d of dimensions) {
      if (d.under === undefined || underIsChosen(d.under, out)) continue;
      if (!isFilterActive(d, out[d.key])) continue;
      out = { ...out, ...clearedFilterValue([d]) };
      changed = true;
    }
  }
  return out;
}

/** One section of the body: a dimension and the folds that show under it now. */
export interface FilterSection {
  dim: FilterDimension;
  folds: FilterFold[];
}

/**
 * THE BODY'S ORDER, decided once for both halves: every top-level dimension that is not a flag
 * gets a section in the caller's order, with the folds whose value is chosen; every top-level flag
 * goes to the last *Show* section.
 */
export function filterLayout(
  dimensions: FilterDimension[],
  value: FilterValue,
): { sections: FilterSection[]; flags: FlagDimension[] } {
  const top = dimensions.filter((d) => d.under === undefined);
  return {
    sections: top
      .filter((d) => d.kind !== 'flag')
      .map((dim) => ({ dim, folds: foldsUnder(dim.key, dimensions, value) })),
    flags: top.filter((d): d is FlagDimension => d.kind === 'flag'),
  };
}

function foldsUnder(key: string, dimensions: FilterDimension[], value: FilterValue): FilterFold[] {
  const folds = new Map<string, FilterFold>();
  for (const d of dimensions) {
    const under = d.under;
    if (under === undefined || under.key !== key || !underIsChosen(under, value)) continue;
    const id = `${under.key}:${under.value}:${under.group}`;
    const fold = folds.get(id) ?? { key: id, title: under.group, dimensions: [] };
    fold.dimensions.push(d);
    folds.set(id, fold);
  }
  return [...folds.values()];
}

/** The chips a chip dimension shows as chosen: a facet's set, or a one-of's one value (its "all" while unset). */
export function chosenChips(
  dim: FacetDimension | OneOfDimension,
  value: FilterDimensionValue,
): string[] {
  if (dim.kind === 'facet') return facetDimensionValues(value);
  const one = typeof value === 'string' ? value : oneOfAllValue(dim);
  return one === undefined ? [] : [one];
}

/** A chip list shows this many before *Show all* — design-system change 8. */
export const CHIP_LIST_CAP = 6;

/**
 * The chips a list shows: all of them when it is short or opened, else the first six and any
 * chosen one beyond them — a chosen value is never hidden behind *Show all*.
 */
export function shownChipOptions(
  options: FilterOption[],
  chosen: readonly string[],
  showAll: boolean,
): { shown: FilterOption[]; capped: boolean } {
  if (showAll || options.length <= CHIP_LIST_CAP) return { shown: options, capped: false };
  return {
    shown: options.filter((o, i) => i < CHIP_LIST_CAP || chosen.includes(optionValue(o))),
    capped: true,
  };
}

function labelOf(options: FilterOption[], value: string): string {
  const option = options.find((o) => optionValue(o) === value);
  return option === undefined ? value : optionLabel(option);
}

/** What is on, at a section's right — `null` while the dimension does nothing. */
export function dimensionSummary(
  dim: FilterDimension,
  value: FilterDimensionValue,
  words: FilterSetWords,
): string | null {
  if (!isFilterActive(dim, value)) return null;
  switch (dim.kind) {
    case 'facet': {
      const chosen = facetDimensionValues(value);
      const only = chosen.length === 1 ? chosen[0] : undefined;
      return only === undefined ? words.selected(chosen.length) : labelOf(dim.options, only);
    }
    case 'one-of':
      return typeof value === 'string' ? labelOf(dim.options, value) : null;
    case 'range': {
      const range = asRange(value);
      if (range === null) return null;
      return rangeReadout({
        lo: range[0],
        hi: range[1],
        min: dim.min,
        max: dim.max,
        anyLabel: dim.anyLabel,
        unit: dim.unit,
        format: dim.format,
      });
    }
    case 'flag':
      return null;
  }
}

/** What is on inside a fold, at its line's right — `undefined` while nothing is. */
export function foldSummary(
  fold: FilterFold,
  value: FilterValue,
  words: FilterSetWords,
): TranslatedText | undefined {
  const on = countActiveFilters(fold.dimensions, value);
  return on === 0 ? undefined : words.groupOn(on);
}

/**
 * `FilterPanel`'s measures when the caller names none: a side panel from 720 of the layer's own
 * width, 460 wide, over the page at 40.
 */
export const FILTER_PANEL_DEFAULTS = { panelAbove: 720, width: 460, zIndex: 40 } as const;

/**
 * One dimension's change as the whole value the caller is handed — every folded dimension whose
 * value is no longer chosen cleared in the same write.
 */
export function dimensionChangeOf(
  dimensions: FilterDimension[],
  value: FilterValue,
  onChange: ((value: FilterValue) => void) | undefined,
): (key: string, next: FilterDimensionValue) => void {
  return (key, next) => onChange?.(withDimension(dimensions, value, key, next));
}

export interface FilterFooter {
  /** *Clear all* has nothing to clear, so it is disabled. */
  nothingOn: boolean;
  /** The caller's own clear when it has one, else every dimension written back to "off". */
  clear: () => void;
  /** A LABELLED DISMISS — "Show 24 results" — never an apply; plain *Done* without a count. */
  doneLabel: TranslatedText;
}

export function filterFooterOf({
  dimensions,
  value,
  onChange,
  onClear,
  resultCount,
  resultNoun,
  words,
}: {
  dimensions: FilterDimension[];
  value: FilterValue;
  onChange: ((value: FilterValue) => void) | undefined;
  onClear: (() => void) | undefined;
  resultCount: number | undefined;
  resultNoun: TranslatedText | undefined;
  words: FilterPanelWords;
}): FilterFooter {
  return {
    nothingOn: countActiveFilters(dimensions, value) === 0,
    clear: () => (onClear ? onClear() : onChange?.(clearedFilterValue(dimensions))),
    doneLabel:
      typeof resultCount === 'number' ? words.showResults(resultCount, resultNoun) : words.done,
  };
}
