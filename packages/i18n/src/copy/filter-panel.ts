import type { FilterPanelWords } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/**
 * The filter body's own words (`FilterPanel`, design-system change 8) — the ones no dimension
 * carries. A dimension's name, options, noun and fold title are the screen's words.
 */
export const FILTER_PANEL = {
  title: /*i18n*/ { id: 'Filters' },
  show: /*i18n*/ { id: 'Show' },
  showAll: /*i18n*/ { id: 'Show all {count} {noun}' },
  showAllPlain: /*i18n*/ { id: 'Show all {count}' },
  selected: /*i18n*/ { id: '{count} selected' },
  groupOn: /*i18n*/ { id: '{count} on' },
  clearAll: /*i18n*/ { id: 'Clear all' },
  done: /*i18n*/ { id: 'Done' },
  showResults: /*i18n*/ { id: 'Show {count} {noun}' },
  showResultsPlain: /*i18n*/ { id: '{count, plural, one {Show # result} other {Show # results}}' },
  selectedTick: /*i18n*/ { id: 'Selected' },
  rangeFrom: /*i18n*/ { id: 'From' },
  rangeTo: /*i18n*/ { id: 'To' },
} as const;

/** The filter body's words in the reader's language — handed whole to `words`; `translate` is the mount's `t`. */
export function filterPanelWords(translate: Translator['t']) {
  return {
    title: translate(FILTER_PANEL.title),
    show: translate(FILTER_PANEL.show),
    showAll: (count, noun) =>
      noun === undefined
        ? translate(FILTER_PANEL.showAllPlain, { count })
        : translate(FILTER_PANEL.showAll, { count, noun }),
    selected: (count) => translate(FILTER_PANEL.selected, { count }),
    groupOn: (count) => translate(FILTER_PANEL.groupOn, { count }),
    clearAll: translate(FILTER_PANEL.clearAll),
    done: translate(FILTER_PANEL.done),
    showResults: (count, noun) =>
      noun === undefined
        ? translate(FILTER_PANEL.showResultsPlain, { count })
        : translate(FILTER_PANEL.showResults, { count, noun }),
    selectedTick: translate(FILTER_PANEL.selectedTick),
    rangeEnds: [translate(FILTER_PANEL.rangeFrom), translate(FILTER_PANEL.rangeTo)],
  } satisfies FilterPanelWords & { selectedTick: string; rangeEnds: [string, string] };
}
