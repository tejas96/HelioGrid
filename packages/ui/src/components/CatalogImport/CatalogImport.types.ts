import type {
  CatalogImportRowFixWrite,
  CatalogImportRowWire,
  CatalogImportSummaryWire,
  CatalogImportWire,
  TranslatedText,
} from '@heliogrid/contracts';
import type {
  CatalogImportAttentionReason,
  CatalogImportField,
  CatalogImportMapping,
  CatalogImportRowFailure,
  ComponentKind,
  ImportContinueGate,
  ImportWizardFrame,
  Read,
} from '@heliogrid/domain';
import type { DropzoneWords, PickedFile } from '../Dropzone/Dropzone.types';
import type { NumberFieldWords } from '../NumberField/NumberField.types';
import type { OperationProgressWords } from '../OperationProgress/OperationProgress.types';
import type { StepperWords } from '../Stepper/Stepper.types';

/**
 * **The catalog import wizard** (`SCR-M01-17`, `M01-41`): File · Columns · Preview · Import report,
 * with the matching wait and the run between them, on its own surface — a full sheet at 375 (an
 * auto-height sheet for the two waits) and a 960px non-modal side panel at 1536 over the page that
 * opened it. The frame is domain's `importWizardFrame`; the job, its rows and every act are
 * `@heliogrid/data`'s import hooks'; every word is `@heliogrid/i18n`'s `catalogImportWords`. Which
 * card a row asks with, and the request its fix sends, are domain's (`importFixAct`,
 * `importFixRequest`); this part only draws them, and holds what is drawn: the open groups and the
 * step-list sheet.
 */
export interface CatalogImportProps {
  open: boolean;
  /** Close and Esc, and *Back* on step 1 at 1536: a dismissal, never a navigation. */
  onClose: () => void;
  words: CatalogImportWords;
  frame: ImportWizardFrame;
  /** The job as last read; `null` before a file is chosen. */
  job: CatalogImportWire | null;
  /** A kept report reopening: its job not yet read. */
  opening: boolean;
  /**
   * The device's top inset, which the full-height sheet's head stays below — the phone's status
   * bar, read by the app that holds the safe areas (`screen-parts.md`). A web sheet has none: 0.
   */
  safeTop: number;

  /** Step 1. */
  upload: ImportUpload;
  onFiles: (files: PickedFile[]) => void;
  /** The phone's document picker, which the native half opens in place of a drop. */
  onRequestFiles?: () => void;
  onReplace: () => void;
  mapping: CatalogImportMapping | null;
  onSheet: (sheet: number) => void;
  onHeaderRow: (headerRow: number) => void;
  kept: ImportKept;
  onOpenKept: (id: string) => void;

  /** Step 2. */
  onPlace: (column: number, field: CatalogImportField | null) => void;

  /** Steps 3 and 4: the lists the overview scopes, as the app reads them. */
  lists: ImportLists;
  /** The group the overview scopes to, or `null`. */
  scope: string | null;
  onScope: (group: string) => void;
  query: string;
  onQuery: (query: string) => void;
  /** The rows this visit settled, by the card's row, and their *Undo*. */
  fixed: ReadonlyMap<number, { readonly row: CatalogImportRowWire }>;
  /** The fix for this row is out. */
  busy: (rowNumber: number) => boolean;
  /** A card's answer: `target` is the row the request goes to — its own, or a repeat's earlier row. */
  onFix: (
    card: CatalogImportRowWire,
    target: number,
    body: CatalogImportRowFixWrite,
    undo: CatalogImportRowFixWrite,
  ) => void;
  onUndo: (cardRow: number) => void;

  /** The acts. */
  gate: ImportContinueGate | null;
  onBack: () => void;
  onContinue: () => void;
  onRun: () => void;
  /** *Stop watching*: the sheet closes, the run goes on. */
  onStopWatching: () => void;
  /** *Fix the N rows*. */
  onFixOpenRows: () => void;
  /** A refusal the step must say, in words the app chose; `null` says nothing. */
  notice: { readonly title: TranslatedText; readonly message: TranslatedText } | null;
}

/** Where a chosen file stands before its job exists. */
export interface ImportUpload {
  readonly state: 'idle' | 'storing' | 'refused' | 'failed';
  /** The Dropzone's `accept`: the catalog file rule's types, as extensions and media types. */
  readonly accept: string;
  /** The catalog file rule's ceiling, in MB, for the hint. */
  readonly maxSizeMB: number;
  /** The words of a refusal or a failed upload; `null` otherwise. */
  readonly message: TranslatedText | null;
  readonly onRetry: () => void;
}

/** *Kept reports*: each import by file name and saved date, newest first. */
export interface ImportKept {
  readonly rows: readonly CatalogImportSummaryWire[];
  readonly hasMore: boolean;
  readonly onMore: () => void;
}

/** One list of rows as a hook pages it. */
export interface ImportRowList {
  /** The list's read: a failed one offers *Try again* instead of looking empty. */
  readonly read: Read<readonly CatalogImportRowWire[]>;
  readonly total: number;
  readonly hasMore: boolean;
  readonly onMore: () => void;
}

/**
 * The preview's lists — the rows that need the person and the two outcome groups — or the report's:
 * failed, left out, prices applied and products created. `found` holds a search's two lists.
 */
export interface ImportLists {
  readonly attention: ImportRowList | null;
  readonly groups: readonly (ImportRowList & { readonly id: ImportGroupId })[];
  readonly found: { readonly attention: ImportRowList; readonly ready: ImportRowList } | null;
  /** In the fix scope, the open rows now ready — *Import N rows*' N, whatever a search shows. */
  readonly ready?: number;
}

export type ImportGroupId =
  | 'overrides'
  | 'newItems'
  | 'attention'
  | 'imported'
  | 'applied'
  | 'created'
  | 'leftOut'
  | 'failed';

/** What a row's question or reason names, for the words that ask it. */
export interface ImportRowWordsFacts {
  /** The product the row names: its own cells' brand and model, or its file text. */
  // biome-ignore lint/plugin/copy-prop-type: a fact of the file's row
  readonly product: string;
  /** The one item it named, by brand and model; `null` where it named none or several. */
  // biome-ignore lint/plugin/copy-prop-type: a fact of the file's row
  readonly named: string | null;
  /** The field that disagrees, and both values, on a spec conflict. */
  readonly conflict: {
    // biome-ignore lint/plugin/copy-prop-type: the field's name, or its key where the catalog names none
    readonly field: string;
    // biome-ignore lint/plugin/copy-prop-type: a fact of the file's row
    readonly file: string;
    // biome-ignore lint/plugin/copy-prop-type: a fact of the catalog's item
    readonly catalog: string;
  } | null;
  /** The price cell as the file wrote it. */
  // biome-ignore lint/plugin/copy-prop-type: a fact of the file's row
  readonly priceText: string;
  /** The earlier row of a repeat, and its price. */
  // biome-ignore lint/plugin/copy-prop-type: a fact of the file's row
  readonly repeat: { readonly row: number; readonly price: string | null } | null;
  /** *one metre* · *one piece*: what a unit of the row is, or `null` where the file says none. */
  // biome-ignore lint/plugin/copy-prop-type: a unit as the file writes it
  readonly unit: string | null;
}

/** Every word the wizard draws. Facts in, sentences out; the language is the caller's. */
export interface CatalogImportWords {
  readonly title: TranslatedText;
  readonly close: TranslatedText;
  readonly back: TranslatedText;
  readonly steps: readonly [TranslatedText, TranslatedText, TranslatedText, TranslatedText];
  readonly stepsLabel: TranslatedText;
  readonly location: (step: number) => TranslatedText;
  readonly locationLabel: (step: number) => TranslatedText;
  readonly whereYouAre: TranslatedText;
  readonly reportAfterRun: TranslatedText;
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
  readonly matchedIntro: (matched: number, columns: number, open: number) => TranslatedText;
  readonly matchedAutomatically: TranslatedText;
  readonly chooseField: TranslatedText;
  readonly importColumnAs: (header: string) => TranslatedText;
  readonly leftOutHelper: TranslatedText;
  readonly leaveColumnOut: TranslatedText;
  readonly fields: Readonly<Record<CatalogImportField, TranslatedText>>;
  readonly matching: TranslatedText;
  readonly heading: (rows: number) => TranslatedText;
  readonly readyShort: (ready: number) => TranslatedText;
  readonly readyLong: (ready: number, needYou: number) => TranslatedText;
  readonly written: (applied: number, created: number) => TranslatedText;
  readonly willDo: TranslatedText;
  readonly didDo: TranslatedText;
  readonly barSentence: (
    parts: readonly { readonly label: TranslatedText; readonly count: number }[],
  ) => TranslatedText;
  readonly ringLabel: (label: string, count: number) => TranslatedText;
  readonly groups: Readonly<Record<ImportGroupId, TranslatedText>>;
  readonly groupTitle: (group: string, count: number) => TranslatedText;
  readonly countRows: (count: number) => TranslatedText;
  readonly overrideLine: TranslatedText;
  readonly find: TranslatedText;
  readonly matchLine: (found: number, rows: number, query: string) => TranslatedText;
  readonly needYou: TranslatedText;
  readonly readyToImport: TranslatedText;
  readonly fixedProgress: (fixed: number, of: number) => TranslatedText;
  readonly rowSub: (
    row: number,
    product: string | null,
    kind: 'override' | 'own' | 'new' | 'notCreated' | 'matches' | 'several' | 'plain',
  ) => TranslatedText;
  readonly question: (
    reason: CatalogImportAttentionReason,
    facts: ImportRowWordsFacts,
  ) => TranslatedText;
  readonly yourPrice: TranslatedText;
  readonly setPrice: TranslatedText;
  readonly leaveOut: TranslatedText;
  readonly keepSpec: TranslatedText;
  readonly importAsOwn: TranslatedText;
  readonly useThisPrice: TranslatedText;
  readonly whichProduct: TranslatedText;
  readonly chooseProduct: TranslatedText;
  readonly kindLabel: TranslatedText;
  readonly chooseKind: TranslatedText;
  readonly kinds: Readonly<Record<ComponentKind, TranslatedText>>;
  readonly fixedLine: (
    fix: 'price' | 'answer' | 'kind' | 'pick' | 'repeat' | 'leftOut',
    value: string | null,
  ) => TranslatedText;
  readonly undo: TranslatedText;
  readonly outcomes: Readonly<
    Record<'override' | 'own' | 'new' | 'leftOut' | 'failed', TranslatedText>
  >;
  readonly noPrice: TranslatedText;
  readonly unchanged: TranslatedText;
  readonly becomes: TranslatedText;
  readonly reason: (
    facts: ImportRowWordsFacts & {
      readonly attention: CatalogImportAttentionReason | null;
      readonly failure: CatalogImportRowFailure | null;
    },
  ) => TranslatedText;
  readonly importRows: (count: number) => TranslatedText;
  readonly undoLine: TranslatedText;
  readonly nextColumns: TranslatedText;
  readonly nextRows: TranslatedText;
  readonly continue: TranslatedText;
  readonly gates: Readonly<Record<ImportContinueGate | 'nothing_ready', TranslatedText>>;
  readonly importing: TranslatedText;
  readonly ofRows: (total: number) => TranslatedText;
  readonly stopWatching: TranslatedText;
  readonly keepsRunning: TranslatedText;
  readonly fixRows: (count: number) => TranslatedText;
  readonly kept: TranslatedText;
  readonly opening: TranslatedText;
  /** What a select, the search, the steps, the drop, a price field and the waits say of their own. */
  readonly selectPlaceholder: TranslatedText;
  readonly closeList: TranslatedText;
  readonly clearSearch: TranslatedText;
  readonly stepper: StepperWords;
  readonly dropzone: DropzoneWords;
  readonly numberField: NumberFieldWords;
  readonly progress: OperationProgressWords;
}
