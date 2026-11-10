import type { TranslatedText } from '@heliogrid/contracts';
import type { ImportColumnViews, ImportSheet, ImportWizardFrame } from '@heliogrid/domain';
import type { DropzoneWords, PickedFile } from '../Dropzone/Dropzone.types';
import type { OperationProgressWords } from '../OperationProgress/OperationProgress.types';

/**
 * **The spreadsheet import's shared parts** (`M01-41`, `M02-18`): the file step with its kept
 * reports, the columns step, the two waits and the step's act — drawn alike by every import that
 * reads a spreadsheet (the catalog's price list, the CRM's old leads). Each import supplies its own
 * job, fields and words; nothing here knows which import it draws.
 */

/** The market's formats an import's words take. */
export interface ImportFormats {
  readonly money: (amount: string) => string;
  readonly date: (iso: string) => string;
  readonly clockAt: (iso: string) => string;
}

/** The sheet and header row a file is read from: the person's pick, then the job's mapping. */
export interface ImportSheetPick {
  readonly sheet: number;
  readonly headerRow: number;
}

/** What every import job carries that the shared parts read; each import's wire satisfies it. */
export interface ImportJobFacts {
  readonly fileName: string;
  readonly status: string;
  readonly sheets: readonly ImportSheet[] | null;
  readonly mapping: ImportSheetPick | null;
  readonly counts: { readonly rows: number } | null;
  readonly run: { readonly at: string; readonly done: number; readonly total: number } | null;
}

/** Where a chosen file stands before its job exists. */
export interface ImportUpload {
  readonly state: 'idle' | 'storing' | 'refused' | 'failed';
  /** The Dropzone's `accept`: the import's file rule's types, as extensions and media types. */
  readonly accept: string;
  /** The import's file rule's ceiling, in MB, for the hint. */
  readonly maxSizeMB: number;
  /** The words of a refusal or a failed upload; `null` otherwise. */
  readonly message: TranslatedText | null;
  readonly onRetry: () => void;
}

/** One kept import: the file it read and when that file was saved. */
export interface ImportKeptReport {
  readonly id: string;
  readonly fileName: string;
  readonly savedAt: string | null;
  readonly createdAt: string;
}

/** *Kept reports*: each import by file name and saved date, newest first. */
export interface ImportKept {
  readonly rows: readonly ImportKeptReport[];
  readonly hasMore: boolean;
  readonly onMore: () => void;
}

/** Every word the file step and its kept reports draw. */
export interface ImportFileWords {
  readonly choose: TranslatedText;
  readonly chooseHint: (maxSizeMB: number) => TranslatedText;
  readonly dropAnother: TranslatedText;
  readonly dropAnotherHint: (maxSizeMB: number) => TranslatedText;
  readonly replace: TranslatedText;
  readonly fileMeta: (rows: number, columns: number) => TranslatedText;
  readonly fileProblem: TranslatedText;
  readonly subtitle: (file: string, rows: number) => TranslatedText;
  readonly subtitleImported: (
    file: string,
    rows: number,
    date: string,
    time: string,
  ) => TranslatedText;
  readonly stamp: (date: string, time: string) => TranslatedText;
  readonly sheetLabel: TranslatedText;
  readonly sheetHelper: (count: number) => TranslatedText;
  readonly headerRowLabel: TranslatedText;
  readonly rowOption: (row: number) => TranslatedText;
  readonly rowReads: (row: number) => TranslatedText;
  readonly rowOfFile: (row: number) => TranslatedText;
  readonly untouched: TranslatedText;
  readonly keptReports: TranslatedText;
  readonly saved: (date: string) => TranslatedText;
  readonly showMore: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly unreadableTitle: TranslatedText;
  readonly unreadableMessage: TranslatedText;
  /** What a select and the drop say of their own. */
  readonly selectPlaceholder: TranslatedText;
  readonly closeList: TranslatedText;
  readonly dropzone: DropzoneWords;
}

/** Every word the columns step draws; each field's own word comes with the field. */
export interface ImportColumnsWords {
  readonly matchedIntro: (matched: number, columns: number, open: number) => TranslatedText;
  readonly matchedAutomatically: TranslatedText;
  readonly chooseField: TranslatedText;
  readonly importColumnAs: (header: string) => TranslatedText;
  readonly leftOutHelper: TranslatedText;
  readonly leaveColumnOut: TranslatedText;
  readonly closeList: TranslatedText;
}

/** Every word the two waits draw: the matching pass and the run. */
export interface ImportWaitWords {
  readonly matching: TranslatedText;
  readonly importing: TranslatedText;
  readonly ofRows: (total: number) => TranslatedText;
  readonly progress: OperationProgressWords;
}

/** The ways out the foot names beside the act. */
export interface ImportFootWords {
  readonly close: TranslatedText;
  readonly back: TranslatedText;
}

/** A step's one act and the line read with it. */
export interface ImportAct {
  readonly label: TranslatedText;
  /** Why the act waits, said in its bubble; `null` when it may go. */
  readonly gate: TranslatedText | null;
  readonly onPress: () => void;
  readonly secondary: boolean;
  readonly line: TranslatedText | null;
  /** What the wide foot offers before the line: *Back*, or *Close* where nothing is behind. */
  readonly leading: 'back' | 'close';
}

/**
 * Step 1, the file: the drop surface (the phone's picker) before a file is chosen, the problem
 * and another chance for a file that would not open, and once read the file chip, its sheet, its
 * header row and that row's cells.
 */
export interface ImportFileStepProps {
  frame: ImportWizardFrame;
  words: ImportFileWords;
  /** The 1536 form: the selects side by side, a second drop under the read file. */
  wide: boolean;
  formats: ImportFormats;
  /** The job as last read; `null` before a file is chosen. */
  job: ImportJobFacts | null;
  /** The person's sheet and header row before they confirm; `null` before the file is read. */
  mapping: ImportSheetPick | null;
  upload: ImportUpload;
  onFiles: (files: PickedFile[]) => void;
  /** The phone's document picker, which the native half opens in place of a drop. */
  onRequestFiles?: () => void;
  onReplace: () => void;
  onSheet: (sheet: number) => void;
  onHeaderRow: (headerRow: number) => void;
  /** Kept reports while no file is chosen; an import that keeps none passes null. */
  kept: ImportKept | null;
  onOpenKept: (id: string) => void;
}

/**
 * Step 2, the columns: each column by the file's own header, an arrow and the field it fills —
 * the ones the guess could not place first, then the ones it matched, to be checked once.
 */
export interface ImportColumnsProps<Field extends string> {
  words: ImportColumnsWords;
  /** The import's fields in the order its choice lists them, each with its word. */
  fields: readonly { readonly value: Field; readonly label: TranslatedText }[];
  columns: ImportColumnViews<Field>;
  /** Draw each column's first values under its header (the lead import); the catalog draws none. */
  samples: boolean;
  /** The 1536 form: two columns to a line. */
  wide: boolean;
  onPlace: (column: number, field: Field | null) => void;
}

/** The matching pass: a short wait with no count and no cancel — *Back* is the way out. */
export interface ImportMatchingProps {
  words: ImportWaitWords;
}

/** The run: the file, and the ring that counts the rows written. */
export interface ImportRunningProps {
  words: ImportWaitWords & ImportFileWords;
  job: ImportJobFacts;
  mapping: ImportSheetPick | null;
  formats: ImportFormats;
}

/**
 * The step's act and the one line read with it. At 375 one full-width act with its line under it;
 * at 1536 *Back* (or *Close*, where there is nothing to go back to), the line and the act share
 * one row. A gated act says why in its bubble, never in a drawn line.
 */
export interface ImportFootProps {
  act: ImportAct | null;
  /** The line drawn when there is no act (a kept report's), else null. */
  quiet: TranslatedText | null;
  /** The web's 1536 row (Back · line · act); the phone is always the narrow form. */
  wide: boolean;
  frame: ImportWizardFrame;
  words: ImportFootWords;
  onClose: () => void;
  onBack: () => void;
}
