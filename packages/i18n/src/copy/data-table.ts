/**
 * `DataTable`'s own words (`packages/ui`'s `DataTableWords`): its loading name, the selection band,
 * the ticks' names, a fixed row's line, a continued caption, the total's scope and verdict, the
 * phone's spoken sort and the pager — authored once for every table, in three languages (`F3-07`).
 * `DATA_TABLE` holds the words a table's blocked states said before a caller named its own.
 */
import type { Translator } from '../runtime';
import { CATALOG_SETTINGS } from './catalog-settings';
import { NOTIFICATION_CENTRE } from './notifications';
import { SHELL } from './shell';

export const DATA_TABLE = {
  emptyTitle: /*i18n*/ { id: 'Nothing here yet' },
  errorTitle: /*i18n*/ { id: "Couldn't load these records" },
  errorMessage: SHELL.keepsFailing,
  unavailableTitle: NOTIFICATION_CENTRE.landingTitle,
} as const;

const TABLE = {
  loading: /*i18n*/ { id: 'Loading records' },
  selected: /*i18n*/ { id: '{count} selected' },
  clearSelection: /*i18n*/ { id: 'Clear selection' },
  selectEveryRow: /*i18n*/ { id: 'Select every row' },
  selectRow: /*i18n*/ { id: 'Select row {key}' },
  selectNamed: /*i18n*/ { id: 'Select {name}' },
  choosePlaceholder: /*i18n*/ { id: 'Select an option' },
  closeList: /*i18n*/ { id: 'Close the list' },
  fixed: /*i18n*/ { id: 'Fixed.' },
  openRecord: /*i18n*/ { id: 'Open record' },
  continued: /*i18n*/ { id: '{caption} (continued)' },
  allLines: /*i18n*/ { id: '{count, plural, one {all # line} other {all # lines}}' },
  reconciles: /*i18n*/ { id: 'Reconciles with {label}.' },
  disagrees: /*i18n*/ {
    id: '{label} is {amount} — {gap} apart. A disagreement is a defect, not a display difference.',
  },
  notSorted: /*i18n*/ { id: '{column}, not sorted' },
  sortedAscending: /*i18n*/ { id: '{column}, sorted ascending' },
  sortedDescending: /*i18n*/ { id: '{column}, sorted descending' },
  sortsAscending: /*i18n*/ { id: 'Sorts ascending' },
  sortsDescending: /*i18n*/ { id: 'Sorts descending' },
} as const;

/** The span one page shows — "1–20 of 342" is `{ from: 1, to: 20, count: 342 }`. */
interface PageSpan {
  readonly from: number;
  readonly to: number;
  readonly count: number;
}

/** Every word `DataTable` draws or speaks of its own, in the reader's language. */
export function dataTableWords(t: Translator['t']) {
  return {
    loading: t(TABLE.loading),
    selected: (count: number) => t(TABLE.selected, { count }),
    clearSelection: t(TABLE.clearSelection),
    selectEveryRow: t(TABLE.selectEveryRow),
    selectRow: (key: string) => t(TABLE.selectRow, { key }),
    selectNamed: (name: string) => t(TABLE.selectNamed, { name }),
    choosePlaceholder: t(TABLE.choosePlaceholder),
    closeList: t(TABLE.closeList),
    fixed: t(TABLE.fixed),
    openRecord: t(TABLE.openRecord),
    continued: (caption: string) => t(TABLE.continued, { caption }),
    allLines: (count: number) => t(TABLE.allLines, { count }),
    reconciles: (label: string) => t(TABLE.reconciles, { label: label.toLowerCase() }),
    disagrees: (label: string, amount: string, gap: string) =>
      t(TABLE.disagrees, { label, amount, gap }),
    notSorted: (column: string) => t(TABLE.notSorted, { column }),
    sortedAscending: (column: string) => t(TABLE.sortedAscending, { column }),
    sortedDescending: (column: string) => t(TABLE.sortedDescending, { column }),
    sortsAscending: t(TABLE.sortsAscending),
    sortsDescending: t(TABLE.sortsDescending),
    previousPage: t(CATALOG_SETTINGS.previousPage),
    nextPage: t(CATALOG_SETTINGS.nextPage),
    pageRange: ({ from, to, count }: PageSpan) =>
      t(CATALOG_SETTINGS.pageRange, { from, to, count }),
  };
}
