import type {
  CatalogImportRowFixWrite,
  CatalogImportRowWire,
  CatalogImportSummaryWire,
  CatalogImportWire,
} from '@heliogrid/contracts';
import type {
  CatalogImportAttentionReason,
  CatalogImportField,
  CatalogImportMapping,
  CatalogImportRowFailure,
  ComponentKind,
  ImportContinueGate,
  ImportWizardFrame,
} from '@heliogrid/domain';
import type { PickedFile } from '../Dropzone/Dropzone.types';

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
  /** Rows whose fix is out. */
  busy: ReadonlySet<number>;
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
  notice: { readonly title: string; readonly message: string } | null;
}

/** Where a chosen file stands before its job exists. */
export interface ImportUpload {
  readonly state: 'idle' | 'storing' | 'refused' | 'failed';
  /** The Dropzone's `accept`: the catalog file rule's types, as extensions and media types. */
  readonly accept: string;
  /** The catalog file rule's ceiling, in MB, for the hint. */
  readonly maxSizeMB: number;
  /** The words of a refusal or a failed upload; `null` otherwise. */
  readonly message: string | null;
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
  readonly rows: readonly CatalogImportRowWire[];
  readonly total: number;
  readonly loading: boolean;
  /** The read failed: the list offers *Try again* (its `onRetry`) instead of looking empty. */
  readonly failed?: boolean;
  readonly onRetry?: () => void;
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
  readonly product: string;
  /** The one item it named, by brand and model; `null` where it named none or several. */
  readonly named: string | null;
  /** The field that disagrees, and both values, on a spec conflict. */
  readonly conflict: {
    readonly field: string;
    readonly file: string;
    readonly catalog: string;
  } | null;
  /** The price cell as the file wrote it. */
  readonly priceText: string;
  /** The earlier row of a repeat, and its price. */
  readonly repeat: { readonly row: number; readonly price: string | null } | null;
  /** *one metre* · *one piece*: what a unit of the row is, or `null` where the file says none. */
  readonly unit: string | null;
}

/** Every word the wizard draws. Facts in, sentences out; the language is the caller's. */
export interface CatalogImportWords {
  readonly title: string;
  readonly close: string;
  readonly back: string;
  readonly steps: readonly [string, string, string, string];
  readonly stepsLabel: string;
  readonly location: (step: number) => string;
  readonly locationLabel: (step: number) => string;
  readonly whereYouAre: string;
  readonly reportAfterRun: string;
  readonly choose: string;
  readonly chooseHint: (maxSizeMB: number) => string;
  readonly dropAnother: string;
  readonly dropAnotherHint: (maxSizeMB: number) => string;
  readonly replace: string;
  readonly fileMeta: (rows: number, columns: number) => string;
  readonly fileProblem: string;
  readonly subtitle: (file: string, rows: number) => string;
  readonly subtitleImported: (file: string, rows: number, date: string, time: string) => string;
  readonly stamp: (date: string, time: string) => string;
  readonly sheetLabel: string;
  readonly sheetHelper: (count: number) => string;
  readonly headerRowLabel: string;
  readonly rowOption: (row: number) => string;
  readonly rowReads: (row: number) => string;
  readonly rowOfFile: (row: number) => string;
  readonly untouched: string;
  readonly keptReports: string;
  readonly saved: (date: string) => string;
  readonly showMore: string;
  readonly tryAgain: string;
  readonly unreadableTitle: string;
  readonly unreadableMessage: string;
  readonly matchedIntro: (matched: number, columns: number, open: number) => string;
  readonly matchedAutomatically: string;
  readonly chooseField: string;
  readonly importColumnAs: (header: string) => string;
  readonly leftOutHelper: string;
  readonly leaveColumnOut: string;
  readonly fields: Readonly<Record<CatalogImportField, string>>;
  readonly matching: string;
  readonly heading: (rows: number) => string;
  readonly readyShort: (ready: number) => string;
  readonly readyLong: (ready: number, needYou: number) => string;
  readonly written: (applied: number, created: number) => string;
  readonly willDo: string;
  readonly didDo: string;
  readonly barSentence: (
    parts: readonly { readonly label: string; readonly count: number }[],
  ) => string;
  readonly ringLabel: (label: string, count: number) => string;
  readonly groups: Readonly<Record<ImportGroupId, string>>;
  readonly groupTitle: (group: string, count: number) => string;
  readonly countRows: (count: number) => string;
  readonly overrideLine: string;
  readonly find: string;
  readonly matchLine: (found: number, rows: number, query: string) => string;
  readonly needYou: string;
  readonly readyToImport: string;
  readonly fixedProgress: (fixed: number, of: number) => string;
  readonly rowSub: (
    row: number,
    product: string | null,
    kind: 'override' | 'own' | 'new' | 'notCreated' | 'matches' | 'several' | 'plain',
  ) => string;
  readonly question: (reason: CatalogImportAttentionReason, facts: ImportRowWordsFacts) => string;
  readonly yourPrice: string;
  readonly setPrice: string;
  readonly leaveOut: string;
  readonly keepSpec: string;
  readonly importAsOwn: string;
  readonly useThisPrice: string;
  readonly whichProduct: string;
  readonly chooseProduct: string;
  readonly kindLabel: string;
  readonly chooseKind: string;
  readonly kinds: Readonly<Record<ComponentKind, string>>;
  readonly fixedLine: (
    fix: 'price' | 'answer' | 'kind' | 'pick' | 'repeat' | 'leftOut',
    value: string | null,
  ) => string;
  readonly undo: string;
  readonly outcomes: Readonly<Record<'override' | 'own' | 'new' | 'leftOut' | 'failed', string>>;
  readonly noPrice: string;
  readonly unchanged: string;
  readonly becomes: string;
  readonly reason: (
    facts: ImportRowWordsFacts & {
      readonly attention: CatalogImportAttentionReason | null;
      readonly failure: CatalogImportRowFailure | null;
    },
  ) => string;
  readonly importRows: (count: number) => string;
  readonly undoLine: string;
  readonly nextColumns: string;
  readonly nextRows: string;
  readonly continue: string;
  readonly gates: Readonly<Record<ImportContinueGate | 'nothing_ready', string>>;
  readonly importing: string;
  readonly ofRows: (total: number) => string;
  readonly stopWatching: string;
  readonly keepsRunning: string;
  readonly fixRows: (count: number) => string;
  readonly kept: string;
  readonly opening: string;
}
