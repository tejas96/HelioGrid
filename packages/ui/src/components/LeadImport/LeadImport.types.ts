import type { DedupeMatchWire, LeadImport, TranslatedText } from '@heliogrid/contracts';
import type {
  ImportColumnViews,
  ImportContinueGate,
  ImportDuplicateChoice,
  ImportPlacedHeader,
  ImportWizardFrame,
  LeadImportField,
  LeadImportFigures,
  LeadImportOutcome,
  LeadImportProblem,
  LeadImportProgress,
  LeadImportRowScope,
  LeadImportRowView,
  LeadImportRunGate,
  LeadImportRunPlan,
  LeadStage,
  Read,
} from '@heliogrid/domain';
import type { DataTableWords } from '../DataTable/DataTable.types';
import type { PickedFile } from '../Dropzone/Dropzone.types';
import type {
  ImportColumnsWords,
  ImportFileWords,
  ImportFootWords,
  ImportSheetPick,
  ImportUpload,
  ImportWaitWords,
} from '../Import/Import.types';
import type { StageTrackWords } from '../StageTrack/StageTrack.types';
import type { StepperWords } from '../Stepper/Stepper.types';

/**
 * **The Lead Import Wizard** (`SCR-M02-05`, `M02-18`…`M02-21`): Upload → Map columns → Preview →
 * Import, then the report — on its own page, one column on the phone and two where the desktop has
 * the room. It draws the shared import family (`../Import`) for the file, the columns and the
 * waits, and its own preview, rows and report. What it draws is `useLeadImportScreen`'s; every
 * word is `@heliogrid/i18n`'s `leadImportWords`. It holds nothing but what is drawn.
 */
export interface LeadImportProps {
  words: LeadImportWords;
  frame: ImportWizardFrame;
  /** The zero-based step the four-step track marks. */
  step: number;
  job: LeadImport | null;
  /** The job is being read again — a followed import or an address reopening — and not in yet. */
  opening: boolean;
  /** The job could not be read: said with its retry, in place of the step. */
  jobFailed: { readonly retry: () => void } | null;
  /** A refusal of the person's last act, in words the app chose; `null` says nothing. */
  notice: { readonly title: TranslatedText; readonly message: TranslatedText } | null;

  upload: ImportUpload;
  onFiles: (files: PickedFile[]) => void;
  /** The phone's document picker, which the native half opens in place of a drop. */
  onRequestFiles?: () => void;
  /** Another file in place of this one. */
  onReplace: () => void;
  sheetPick: ImportSheetPick | null;
  onSheet: (sheet: number) => void;
  onHeaderRow: (headerRow: number) => void;

  columns: ImportColumnViews<LeadImportField>;
  /** The columns the import reads, in the file's order: the report's rows sit under them. */
  headers: readonly ImportPlacedHeader<LeadImportField>[];
  onPlace: (column: number, field: LeadImportField | null) => void;
  gate: ImportContinueGate | null;

  figures: LeadImportFigures | null;
  choice: ImportDuplicateChoice;
  onChoice: (choice: string) => void;
  plan: LeadImportRunPlan | null;
  runGate: LeadImportRunGate | null;
  /** The run is out: *Import* is inert and a second press sends nothing. */
  runOut: boolean;
  progress: LeadImportProgress | null;
  outcome: LeadImportOutcome | null;

  /** The preview's part its rows are narrowed to, or `null` for every row. */
  scope: LeadImportRowScope | null;
  onScope: (scope: string) => void;
  rows: LeadImportRowsList;

  onBack: () => void;
  onContinue: () => void;
  onRun: () => void;
  /** Away from the wizard — the run keeps going on the server. */
  onLeave: () => void;
  /** *Import another file*. */
  onStartOver: () => void;
  /** The report's way to the leads it made. */
  onOpenInbox: () => void;
}

export type LeadImportRow = LeadImportRowView<DedupeMatchWire>;

/** A list of rows as the hook pages it. */
export interface LeadImportRowsList {
  readonly read: Read<readonly LeadImportRow[]>;
  readonly total: number;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  readonly showMore: () => void;
}

/** A choice's title and the one line under it. */
export interface LeadImportChoiceWords {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
}

/** Every word the wizard draws. Facts in, sentences out; the language is the caller's. */
export interface LeadImportWords
  extends ImportFileWords,
    ImportColumnsWords,
    ImportWaitWords,
    ImportFootWords {
  readonly steps: readonly [TranslatedText, TranslatedText, TranslatedText, TranslatedText];
  readonly stepsLabel: TranslatedText;
  readonly stepper: StepperWords;
  readonly fields: Readonly<Record<LeadImportField, TranslatedText>>;
  readonly continue: TranslatedText;
  /** The line under Continue on the file step and the columns step. */
  readonly nextColumns: TranslatedText;
  readonly nextCounts: TranslatedText;
  readonly gates: Readonly<Record<ImportContinueGate | LeadImportRunGate, TranslatedText>>;
  readonly tryAgain: TranslatedText;
  readonly jobFailedTitle: TranslatedText;
  readonly jobFailedMessage: TranslatedText;
  readonly opening: TranslatedText;

  /** The preview's hero: "Before anything runs", "400 rows · 90 duplicates by phone". */
  readonly beforeRuns: TranslatedText;
  readonly counts: (rows: number, duplicates: number) => TranslatedText;
  readonly rejectedCount: (rejected: number) => TranslatedText;
  readonly willDo: TranslatedText;
  readonly parts: Readonly<Record<LeadImportRowScope, TranslatedText>>;
  readonly partLabel: (label: string, count: number) => TranslatedText;
  readonly barSentence: (
    parts: readonly { readonly label: TranslatedText; readonly count: number }[],
  ) => TranslatedText;
  readonly choiceHeading: (duplicates: number) => TranslatedText;
  readonly choices: Readonly<Record<ImportDuplicateChoice, LeadImportChoiceWords>>;
  readonly byDefault: TranslatedText;
  readonly landInInbox: TranslatedText;
  readonly sourceImport: TranslatedText;
  readonly nothingYet: TranslatedText;
  readonly importLeads: (count: number) => TranslatedText;
  readonly logEnquiries: (count: number) => TranslatedText;

  /** The rows: their heads, what happens to each, and why one cannot land. */
  readonly rowsHeading: TranslatedText;
  readonly rejectedHeading: (count: number) => TranslatedText;
  readonly rejectedLine: TranslatedText;
  readonly noneRejected: TranslatedText;
  readonly rowLabel: TranslatedText;
  readonly rowNumber: (row: number) => TranslatedText;
  readonly whatHappens: TranslatedText;
  readonly why: TranslatedText;
  readonly blank: TranslatedText;
  readonly fates: Readonly<
    Record<
      'new_lead' | 'already_here' | 'rejected' | 'landed' | 'logged' | 'skipped',
      TranslatedText
    >
  >;
  readonly willSkip: TranslatedText;
  readonly willLog: TranslatedText;
  readonly repeatsRow: (row: number) => TranslatedText;
  readonly sameNumberTwice: TranslatedText;
  readonly outside: TranslatedText;
  readonly noOwner: TranslatedText;
  readonly stage: Readonly<Record<LeadStage, TranslatedText>>;
  readonly stageTrack: StageTrackWords;
  readonly lastContact: (elapsedMs: number | null) => TranslatedText;
  readonly problems: Readonly<Record<LeadImportProblem, TranslatedText>>;
  readonly problemLines: Readonly<Record<LeadImportProblem, TranslatedText>>;
  readonly shown: (shown: number, total: number) => TranslatedText;
  readonly rowsFailed: TranslatedText;
  readonly loadingRows: TranslatedText;
  readonly noRowsHere: TranslatedText;
  /** A header as the file wrote it, named for the table that heads a column with it. */
  readonly fileHeader: (header: string) => TranslatedText;
  readonly table: DataTableWords;

  /** The run, and leaving it. */
  readonly keepsGoing: TranslatedText;
  readonly keepsGoingLine: TranslatedText;
  readonly backToLeads: TranslatedText;

  /** The report. */
  readonly doneRead: (rows: number) => TranslatedText;
  readonly landed: (count: number) => TranslatedText;
  readonly inInbox: TranslatedText;
  readonly created: TranslatedText;
  readonly duplicatesDone: Readonly<Record<ImportDuplicateChoice, LeadImportChoiceWords>>;
  readonly rejectedRows: LeadImportChoiceWords;
  readonly notRolledBack: TranslatedText;
  readonly openInbox: TranslatedText;
  readonly importAnother: TranslatedText;
  readonly columnsHeading: TranslatedText;
  readonly columnsUsed: (used: number, of: number) => TranslatedText;
  readonly notImported: TranslatedText;
  readonly columnsNamed: TranslatedText;
}
