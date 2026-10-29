import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FilterOption, FiltersButtonProps } from './FilterBar.types';
import { optionIcon, optionValue } from './FilterBar.types';

/** The one chip in the tab order — the chosen one, or the first when none is. */
export function chosenChipIndex(options: FilterOption[], value: string | undefined): number {
  return Math.max(
    0,
    options.findIndex((option) => optionValue(option) === value),
  );
}

/** A facet set with one value toggled: taken out when it is in, added at the end when it is not. */
export function toggledFacets(values: string[], toggled: string): string[] {
  return values.includes(toggled) ? values.filter((x) => x !== toggled) : [...values, toggled];
}

/** A facet's glyph shows only while it is not selected — the tick takes its place. */
export function facetGlyph(option: FilterOption, on: boolean): ReactNode {
  return on ? undefined : optionIcon(option);
}

/**
 * THE SQUARE HAS NO WORDS and the counter is a bare number, so the name is the whole sentence: left
 * to the content it would announce "3", saying nothing about what the 3 counts.
 */
export function filtersButtonName({
  count,
  label,
  activeLabel,
}: Pick<FiltersButtonProps, 'label' | 'activeLabel'> & { count: number }): TranslatedText {
  return count > 0 ? activeLabel(count) : label;
}
