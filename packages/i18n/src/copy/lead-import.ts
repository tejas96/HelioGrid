import type { TranslatedText } from '@heliogrid/contracts';
import type {
  ImportContinueGate,
  ImportDuplicateChoice,
  LeadImportField,
  LeadImportRowScope,
  LeadImportRunGate,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { assembled } from './assembled';
import type { ImportStepperWords } from './catalog-import-rows';
import { crmVocabularyWords } from './crm-vocabulary';
import { dropzoneWords } from './dropzone';
import { leadImportRowWords, wordsOf } from './lead-import-rows';
import { operationProgressWords } from './operation-progress';
import { SELECT } from './select';
import { stepperWords } from './stepper';

type T = Translator['t'];

/** The Lead Import Wizard (`SCR-M02-05`, `M02-18`…`M02-21`), chosen once for both apps (Law 11). */
const WORDS = {
  title: /*i18n*/ { id: 'Import leads' },
  close: /*i18n*/ { id: 'Close' },
  back: /*i18n*/ { id: 'Back' },
  upload: /*i18n*/ { id: 'Upload' },
  mapColumns: /*i18n*/ { id: 'Map columns' },
  preview: /*i18n*/ { id: 'Preview' },
  import: /*i18n*/ { id: 'Import' },
  stepsLabel: /*i18n*/ { id: 'Import steps' },
  choose: /*i18n*/ { id: 'Choose your old spreadsheet of leads' },
  chooseHint: /*i18n*/ { id: 'Excel or CSV · up to {size} MB · one row per lead' },
  dropAnother: /*i18n*/ { id: 'Drop a different spreadsheet here' },
  dropAnotherHint: /*i18n*/ { id: 'Excel or CSV · up to {size} MB · or browse for it' },
  replace: /*i18n*/ { id: 'Replace' },
  fileMeta: /*i18n*/ {
    id: '{rows, plural, one {# row} other {# rows}} · {columns, plural, one {# column} other {# columns}}',
  },
  fileProblem: /*i18n*/ { id: 'Could not be opened' },
  subtitle: /*i18n*/ { id: '{file} · {rows, plural, one {# row} other {# rows}}' },
  subtitleImported: /*i18n*/ {
    id: '{file} · {rows, plural, one {# row} other {# rows}} · imported {date}, {time}',
  },
  stamp: /*i18n*/ { id: 'Imported {date}, {time}' },
  sheetLabel: /*i18n*/ { id: 'Sheet in the file' },
  sheetHelper: /*i18n*/ {
    id: '{count, plural, one {One sheet.} other {# sheets. We read the one with a header row.}}',
  },
  headerRowLabel: /*i18n*/ { id: 'Header row' },
  rowOption: /*i18n*/ { id: 'Row {row}' },
  rowReads: /*i18n*/ { id: 'Row {row} reads' },
  rowOfFile: /*i18n*/ { id: 'Row {row} of the file' },
  untouched: /*i18n*/ { id: 'Nothing is imported until you press Import.' },
  keptReports: /*i18n*/ { id: 'Kept reports' },
  saved: /*i18n*/ { id: 'saved {date}' },
  showMore: /*i18n*/ { id: 'Show more' },
  tryAgain: /*i18n*/ { id: 'Try again' },
  unreadableTitle: /*i18n*/ { id: 'We could not open this file' },
  unreadableMessage: /*i18n*/ { id: 'Choose another file to import.' },
  matchedIntro: /*i18n*/ {
    id: 'We guessed {matched} of your {columns} columns from their headers; {open, plural, one {# still needs you} other {# still need you}}. One column must be Phone.',
  },
  matchedAll: /*i18n*/ {
    id: 'We guessed all {columns} of your columns from their headers. Tap a guess to fix it.',
  },
  matchedAutomatically: /*i18n*/ { id: 'Guessed from the header — check them' },
  chooseField: /*i18n*/ { id: 'Choose a field' },
  importColumnAs: /*i18n*/ { id: 'Import the column “{header}” as' },
  leftOutHelper: /*i18n*/ { id: 'Named in the report, never dropped quietly.' },
  leaveColumnOut: /*i18n*/ { id: 'Don’t import' },
  matching: /*i18n*/ { id: 'Counting your rows and the duplicates by phone' },
  importing: /*i18n*/ { id: 'Importing' },
  ofRows: /*i18n*/ { id: 'of {total, plural, one {# row} other {# rows}}' },
  continue: /*i18n*/ { id: 'Continue' },
  nextColumns: /*i18n*/ { id: 'Next: match the columns to lead fields.' },
  nextCounts: /*i18n*/ { id: 'Nothing is imported yet. Next, the counts.' },
  jobFailedTitle: /*i18n*/ { id: 'Couldn’t read this import' },
  jobFailedMessage: /*i18n*/ {
    id: 'It keeps going on our side. Try again to see where it stands.',
  },
  opening: /*i18n*/ { id: 'Opening the import' },
  beforeRuns: /*i18n*/ { id: 'Before anything runs' },
  counts: /*i18n*/ {
    id: '{rows, plural, one {# row} other {# rows}} · {duplicates, plural, one {# duplicate by phone} other {# duplicates by phone}}',
  },
  rejectedCount: /*i18n*/ {
    id: '{rejected, plural, one {# row can’t be read and will be listed with why} other {# rows can’t be read and will be listed with why}}',
  },
  willDo: /*i18n*/ { id: 'What the import will do' },
  partLabel: /*i18n*/ { id: '{label}, {count, plural, one {# row} other {# rows}}' },
  barPart: /*i18n*/ { id: '{count} {label}' },
  choiceHeading: /*i18n*/ {
    id: '{duplicates, plural, one {The duplicate} other {The # duplicates}} · one choice for all',
  },
  skip: /*i18n*/ { id: 'Skip' },
  skipLine: /*i18n*/ { id: 'The existing lead stays as it is. Nothing is added to it.' },
  log: /*i18n*/ { id: 'Log as enquiry on the existing lead' },
  logLine: /*i18n*/ {
    id: 'Each row goes on that lead’s timeline as a new enquiry. Its owner is told.',
  },
  byDefault: /*i18n*/ { id: 'Default' },
  landInInbox: /*i18n*/ { id: 'New leads land in the Inbox, unassigned.' },
  nothingYet: /*i18n*/ { id: 'Nothing is imported yet.' },
  importLeads: /*i18n*/ { id: 'Import {count, plural, one {# lead} other {# leads}}' },
  logEnquiries: /*i18n*/ { id: 'Log {count, plural, one {# enquiry} other {# enquiries}}' },
  keepsGoing: /*i18n*/ { id: 'You can leave — it keeps going.' },
  keepsGoingLine: /*i18n*/ {
    id: 'It runs on our side. Come back here to see where it got to, or the report.',
  },
  backToLeads: /*i18n*/ { id: 'Back to leads' },
  notAllowedTitle: /*i18n*/ { id: 'Importing leads is for an owner or a sales manager' },
  notAllowedMessage: /*i18n*/ {
    id: 'Ask one of them to bring the spreadsheet in. You can still add leads one by one.',
  },
} as const;

const FIELD: Readonly<Record<LeadImportField, { id: string }>> = {
  name: /*i18n*/ { id: 'Name' },
  phone: /*i18n*/ { id: 'Phone' },
  city: /*i18n*/ { id: 'City' },
  segment: /*i18n*/ { id: 'Type' },
  monthly_bill: /*i18n*/ { id: 'Monthly bill' },
};

const PART: Readonly<Record<LeadImportRowScope, { id: string }>> = {
  new: /*i18n*/ { id: 'New leads' },
  duplicate: /*i18n*/ { id: 'Already here, by phone' },
  rejected: /*i18n*/ { id: 'Can’t be read' },
};

const GATE: Readonly<Record<ImportContinueGate | LeadImportRunGate, { id: string }>> = {
  no_file: /*i18n*/ { id: 'Choose a spreadsheet first.' },
  reading: /*i18n*/ { id: 'The file is still being read.' },
  unreadable: /*i18n*/ { id: 'No readable file' },
  columns_unplaced: /*i18n*/ { id: 'Place Phone on one column.' },
  columns_twice: /*i18n*/ { id: 'Place each field on one column only.' },
  matching: /*i18n*/ { id: 'The preview opens when the counting ends.' },
  nothing_to_import: /*i18n*/ { id: 'No row would make a lead or log an enquiry.' },
};

/** The file, columns, preview and run words; the rows and report are `leadImportRowWords`. */
function leadImportStepWords(t: T) {
  const choices: Readonly<
    Record<ImportDuplicateChoice, { title: TranslatedText; line: TranslatedText }>
  > = {
    skip: { title: t(WORDS.skip), line: t(WORDS.skipLine) },
    log_enquiry: { title: t(WORDS.log), line: t(WORDS.logLine) },
  };
  return {
    title: t(WORDS.title),
    close: t(WORDS.close),
    back: t(WORDS.back),
    steps: [t(WORDS.upload), t(WORDS.mapColumns), t(WORDS.preview), t(WORDS.import)] as const,
    stepsLabel: t(WORDS.stepsLabel),
    choose: t(WORDS.choose),
    chooseHint: (size: number) => t(WORDS.chooseHint, { size }),
    dropAnother: t(WORDS.dropAnother),
    dropAnotherHint: (size: number) => t(WORDS.dropAnotherHint, { size }),
    replace: t(WORDS.replace),
    fileMeta: (rows: number, columns: number) => t(WORDS.fileMeta, { rows, columns }),
    fileProblem: t(WORDS.fileProblem),
    subtitle: (file: string, rows: number) => t(WORDS.subtitle, { file, rows }),
    subtitleImported: (file: string, rows: number, date: string, time: string) =>
      t(WORDS.subtitleImported, { file, rows, date, time }),
    stamp: (date: string, time: string) => t(WORDS.stamp, { date, time }),
    sheetLabel: t(WORDS.sheetLabel),
    sheetHelper: (count: number) => t(WORDS.sheetHelper, { count }),
    headerRowLabel: t(WORDS.headerRowLabel),
    rowOption: (row: number) => t(WORDS.rowOption, { row }),
    rowReads: (row: number) => t(WORDS.rowReads, { row }),
    rowOfFile: (row: number) => t(WORDS.rowOfFile, { row }),
    untouched: t(WORDS.untouched),
    keptReports: t(WORDS.keptReports),
    saved: (date: string) => t(WORDS.saved, { date }),
    showMore: t(WORDS.showMore),
    tryAgain: t(WORDS.tryAgain),
    unreadableTitle: t(WORDS.unreadableTitle),
    unreadableMessage: t(WORDS.unreadableMessage),
    matchedIntro: (matched: number, columns: number, open: number) =>
      open === 0
        ? t(WORDS.matchedAll, { columns })
        : t(WORDS.matchedIntro, { matched, columns, open }),
    matchedAutomatically: t(WORDS.matchedAutomatically),
    chooseField: t(WORDS.chooseField),
    importColumnAs: (header: string) => t(WORDS.importColumnAs, { header }),
    leftOutHelper: t(WORDS.leftOutHelper),
    leaveColumnOut: t(WORDS.leaveColumnOut),
    fields: wordsOf(FIELD, t),
    matching: t(WORDS.matching),
    importing: t(WORDS.importing),
    ofRows: (total: number) => t(WORDS.ofRows, { total }),
    continue: t(WORDS.continue),
    nextColumns: t(WORDS.nextColumns),
    nextCounts: t(WORDS.nextCounts),
    gates: wordsOf(GATE, t),
    jobFailedTitle: t(WORDS.jobFailedTitle),
    jobFailedMessage: t(WORDS.jobFailedMessage),
    opening: t(WORDS.opening),
    beforeRuns: t(WORDS.beforeRuns),
    counts: (rows: number, duplicates: number) => t(WORDS.counts, { rows, duplicates }),
    rejectedCount: (rejected: number) => t(WORDS.rejectedCount, { rejected }),
    willDo: t(WORDS.willDo),
    parts: wordsOf(PART, t),
    partLabel: (label: string, count: number) => t(WORDS.partLabel, { label, count }),
    barSentence: (parts: readonly { readonly label: string; readonly count: number }[]) =>
      assembled(parts.map((part) => t(WORDS.barPart, part)).join(', ')),
    choiceHeading: (duplicates: number) => t(WORDS.choiceHeading, { duplicates }),
    choices,
    byDefault: t(WORDS.byDefault),
    landInInbox: t(WORDS.landInInbox),
    sourceImport: crmVocabularyWords(t).source.import,
    nothingYet: t(WORDS.nothingYet),
    importLeads: (count: number) => t(WORDS.importLeads, { count }),
    logEnquiries: (count: number) => t(WORDS.logEnquiries, { count }),
    keepsGoing: t(WORDS.keepsGoing),
    keepsGoingLine: t(WORDS.keepsGoingLine),
    backToLeads: t(WORDS.backToLeads),
    notAllowed: { title: t(WORDS.notAllowedTitle), message: t(WORDS.notAllowedMessage) },
  };
}

/**
 * Every word `LeadImport` draws, in the reader's language. A refused file or act is said by
 * `catalogImportNotes`, the shared import's notes.
 */
export function leadImportWords(t: T) {
  const stepper: ImportStepperWords = stepperWords(t);
  return {
    ...leadImportStepWords(t),
    ...leadImportRowWords(t),
    selectPlaceholder: t(SELECT.placeholder),
    closeList: t(SELECT.closeList),
    stepper,
    dropzone: dropzoneWords(t),
    progress: operationProgressWords(t),
  };
}

export type LeadImportCopy = ReturnType<typeof leadImportWords>;
