/**
 * The filter controls' own words (`FilterBar`'s `SortPills`, `FiltersButton` and `FacetChips`): the
 * word before the sort pills, the filter square's name — whole, with its count, while filters are
 * on, since the square has no words and its counter is a bare number — and a chosen chip's tick.
 */
import type { Translator } from '../runtime';
import { FILTER_PANEL } from './filter-panel';

const FILTER_BAR = {
  sort: /*i18n*/ { id: 'Sort' },
  filtersActive: /*i18n*/ { id: 'Filters, {count} active' },
} as const;

/** Every word the filter controls draw or speak, in the reader's language. */
export function filterBarWords(t: Translator['t']) {
  return {
    sort: t(FILTER_BAR.sort),
    filters: t(FILTER_PANEL.title),
    filtersActive: (count: number) => t(FILTER_BAR.filtersActive, { count }),
    selected: t(FILTER_PANEL.selectedTick),
  };
}
