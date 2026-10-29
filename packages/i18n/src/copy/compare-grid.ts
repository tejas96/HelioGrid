/**
 * `CompareGrid`'s own words (`packages/ui`'s `CompareGridWords`): a row's *Best*, the spoken
 * headings, a gap no row named, the loading name, the scroller's name, where the reader is on the
 * option axis and the steps along it — authored once, in three languages (`F3-07`).
 * `COMPARE_GRID` holds the words the grid said before a caller named its own.
 */
import type { Translator } from '../runtime';
import { SHELL } from './shell';

export const COMPARE_GRID = {
  select: /*i18n*/ { id: 'Choose' },
  selected: /*i18n*/ { id: 'Selected' },
  current: /*i18n*/ { id: 'Current' },
  emptyTitle: /*i18n*/ { id: 'Nothing to compare yet' },
  emptyMessage: /*i18n*/ {
    id: 'Generate at least two variants and they line up here side by side.',
  },
  errorTitle: /*i18n*/ { id: "Couldn't load the comparison" },
  errorMessage: SHELL.keepsFailing,
  unavailableTitle: /*i18n*/ { id: 'Not comparable here' },
} as const;

const GRID = {
  best: /*i18n*/ { id: 'Best' },
  attribute: /*i18n*/ { id: 'Attribute' },
  chooseOption: /*i18n*/ { id: 'Choose an option' },
  notStated: /*i18n*/ { id: 'Not stated' },
  loading: /*i18n*/ { id: 'Loading the comparison' },
  compare: /*i18n*/ { id: '{count, plural, one {Compare # option} other {Compare # options}}' },
  position: /*i18n*/ { id: 'Showing {where} of {count} — swipe or use the arrows' },
  positionNoted: /*i18n*/ { id: 'Showing {where} of {count} — swipe or use the arrows · {note}' },
  previousOption: /*i18n*/ { id: 'Previous option' },
  nextOption: /*i18n*/ { id: 'Next option' },
  optionNamed: /*i18n*/ { id: '{word}: {option}' },
} as const;

/** Every word `CompareGrid` draws or speaks of its own, in the reader's language. */
export function compareGridWords(t: Translator['t']) {
  return {
    best: t(GRID.best),
    attribute: t(GRID.attribute),
    chooseOption: t(GRID.chooseOption),
    notStated: t(GRID.notStated),
    loading: t(GRID.loading),
    compare: (count: number) => t(GRID.compare, { count }),
    position: (where: string, count: number, note?: string) =>
      note === undefined || note === ''
        ? t(GRID.position, { where, count })
        : t(GRID.positionNoted, { where, count, note }),
    previousOption: t(GRID.previousOption),
    nextOption: t(GRID.nextOption),
    optionNamed: (word: string, option: string) => t(GRID.optionNamed, { word, option }),
  };
}
