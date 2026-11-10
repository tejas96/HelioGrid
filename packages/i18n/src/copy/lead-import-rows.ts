import type { TranslatedText } from '@heliogrid/contracts';
import type { ImportDuplicateChoice, LeadImportProblem } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { crmVocabularyWords } from './crm-vocabulary';
import { dataTableWords } from './data-table';
import { lastContactWord, stageTrackWords } from './lead-marks';

type T = Translator['t'];

/**
 * The Lead Import Wizard's rows and report (`SCR-M02-05`, `M02-20`, `M02-21`): what happens to each
 * row, the facts of the record a duplicate met, why a row cannot land, and the report's figures.
 */
const ROWS = {
  rowsHeading: /*i18n*/ { id: 'The rows of your file, as they will land' },
  rejectedHeading: /*i18n*/ {
    id: '{count, plural, one {# row not imported} other {# rows not imported}}',
  },
  rejectedLine: /*i18n*/ {
    id: 'Under your file’s own headers, so each row is easy to find and fix.',
  },
  noneRejected: /*i18n*/ { id: 'Every row could be read. None was turned away.' },
  rowLabel: /*i18n*/ { id: 'Row' },
  rowNumber: /*i18n*/ { id: 'Row {row}' },
  whatHappens: /*i18n*/ { id: 'What happens' },
  why: /*i18n*/ { id: 'Why' },
  blank: /*i18n*/ { id: 'Blank' },
  willSkip: /*i18n*/ { id: 'Will be skipped' },
  willLog: /*i18n*/ { id: 'Enquiry goes on it' },
  repeatsRow: /*i18n*/ { id: 'Repeats row {row}' },
  sameNumberTwice: /*i18n*/ { id: 'Same number twice in this file' },
  outside: /*i18n*/ { id: 'A lead outside your list' },
  noOwner: /*i18n*/ { id: 'No owner yet' },
  shown: /*i18n*/ { id: '{shown} of {total, plural, one {# row} other {# rows}}' },
  rowsFailed: /*i18n*/ { id: 'Couldn’t load the rows' },
  loadingRows: /*i18n*/ { id: 'Loading the rows' },
  noRowsHere: /*i18n*/ { id: 'No row of the file is in this part.' },
  doneRead: /*i18n*/ { id: 'Done · {rows, plural, one {# row read} other {# rows read}}' },
  landed: /*i18n*/ { id: '{count, plural, one {# lead landed} other {# leads landed}}' },
  inInbox: /*i18n*/ { id: 'Each one is in the Inbox, unassigned, with the Import badge.' },
  created: /*i18n*/ { id: 'New leads created' },
  skippedTitle: /*i18n*/ { id: 'Duplicates skipped' },
  skippedLine: /*i18n*/ { id: 'Existing leads left as they were.' },
  loggedTitle: /*i18n*/ { id: 'Duplicates logged as enquiries' },
  loggedLine: /*i18n*/ { id: 'On each existing lead’s timeline. Owners told.' },
  rejectedTitle: /*i18n*/ { id: 'Rows rejected' },
  rejectedRowsLine: /*i18n*/ { id: 'Every one is listed, with why.' },
  notRolledBack: /*i18n*/ { id: 'Nothing that landed is rolled back.' },
  openInbox: /*i18n*/ { id: 'Open the Inbox' },
  importAnother: /*i18n*/ { id: 'Import another file' },
  columnsHeading: /*i18n*/ { id: 'Columns' },
  columnsUsed: /*i18n*/ { id: '{used} of {of} used' },
  notImported: /*i18n*/ { id: 'Not imported' },
  columnsNamed: /*i18n*/ { id: 'Columns left out are named here, never dropped quietly.' },
} as const;

const FATE = {
  new_lead: /*i18n*/ { id: 'New lead' },
  already_here: /*i18n*/ { id: 'Already here' },
  rejected: /*i18n*/ { id: 'Not imported' },
  landed: /*i18n*/ { id: 'Landed' },
  logged: /*i18n*/ { id: 'Enquiry logged' },
  skipped: /*i18n*/ { id: 'Skipped' },
} as const;

const PROBLEM: Readonly<Record<LeadImportProblem, { id: string }>> = {
  unreadable_number: /*i18n*/ { id: 'Unreadable number' },
  missing_number: /*i18n*/ { id: 'No phone' },
  malformed_row: /*i18n*/ { id: 'Malformed row' },
  not_written: /*i18n*/ { id: 'Not written' },
};

const PROBLEM_LINE: Readonly<Record<LeadImportProblem, { id: string }>> = {
  unreadable_number: /*i18n*/ { id: 'The phone cell does not read as a number.' },
  missing_number: /*i18n*/ { id: 'The phone cell is empty.' },
  malformed_row: /*i18n*/ {
    id: 'A bill that is not an amount, or a type that is not Home or Business.',
  },
  not_written: /*i18n*/ { id: 'The import could not write this row.' },
};

/** A closed set's words, keyed as the set is. */
export const wordsOf = <K extends string>(messages: Readonly<Record<K, { id: string }>>, t: T) =>
  Object.fromEntries(
    Object.entries<{ id: string }>(messages).map(([key, message]) => [key, t(message)]),
  ) as Readonly<Record<K, TranslatedText>>;

/** What happens to each row, the record a duplicate met, and the report's figures. */
/** The table's own words, named so the words a screen takes can be declared. */
export interface LeadImportTableWords extends ReturnType<typeof dataTableWords> {}

export function leadImportRowWords(t: T) {
  const table: LeadImportTableWords = dataTableWords(t);
  const choiceDone: Readonly<
    Record<ImportDuplicateChoice, { title: TranslatedText; line: TranslatedText }>
  > = {
    skip: { title: t(ROWS.skippedTitle), line: t(ROWS.skippedLine) },
    log_enquiry: { title: t(ROWS.loggedTitle), line: t(ROWS.loggedLine) },
  };
  return {
    rowsHeading: t(ROWS.rowsHeading),
    rejectedHeading: (count: number) => t(ROWS.rejectedHeading, { count }),
    rejectedLine: t(ROWS.rejectedLine),
    noneRejected: t(ROWS.noneRejected),
    rowLabel: t(ROWS.rowLabel),
    rowNumber: (row: number) => t(ROWS.rowNumber, { row }),
    whatHappens: t(ROWS.whatHappens),
    why: t(ROWS.why),
    blank: t(ROWS.blank),
    fates: wordsOf(FATE, t),
    willSkip: t(ROWS.willSkip),
    willLog: t(ROWS.willLog),
    repeatsRow: (row: number) => t(ROWS.repeatsRow, { row }),
    sameNumberTwice: t(ROWS.sameNumberTwice),
    outside: t(ROWS.outside),
    noOwner: t(ROWS.noOwner),
    stage: crmVocabularyWords(t).stage,
    stageTrack: stageTrackWords(t),
    lastContact: (elapsedMs: number | null) => lastContactWord(t, elapsedMs),
    problems: wordsOf(PROBLEM, t),
    problemLines: wordsOf(PROBLEM_LINE, t),
    shown: (shown: number, total: number) => t(ROWS.shown, { shown, total }),
    rowsFailed: t(ROWS.rowsFailed),
    loadingRows: t(ROWS.loadingRows),
    noRowsHere: t(ROWS.noRowsHere),
    fileHeader: (header: string) => shownAsSent(header),
    table,
    doneRead: (rows: number) => t(ROWS.doneRead, { rows }),
    landed: (count: number) => t(ROWS.landed, { count }),
    inInbox: t(ROWS.inInbox),
    created: t(ROWS.created),
    duplicatesDone: choiceDone,
    rejectedRows: { title: t(ROWS.rejectedTitle), line: t(ROWS.rejectedRowsLine) },
    notRolledBack: t(ROWS.notRolledBack),
    openInbox: t(ROWS.openInbox),
    importAnother: t(ROWS.importAnother),
    columnsHeading: t(ROWS.columnsHeading),
    columnsUsed: (used: number, of: number) => t(ROWS.columnsUsed, { used, of }),
    notImported: t(ROWS.notImported),
    columnsNamed: t(ROWS.columnsNamed),
  };
}
