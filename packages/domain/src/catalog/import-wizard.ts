import {
  CATALOG_IMPORT_ATTENTION_REASONS,
  type CatalogImportAttentionReason,
  type CatalogImportCounts,
  type CatalogImportRowOutcome,
  type CatalogImportRowResult,
  type CatalogImportSheet,
  type CatalogImportState,
} from './import';
import { type CatalogImportField, guessColumns, guessHeaderRow } from './import-columns';
import {
  type CatalogImportColumnsProblem,
  type CatalogImportMapping,
  importColumnsProblem,
} from './import-mapping';

/*
 * The import wizard's flow (`SCR-M01-17`, `M01-41`), authored once for the web panel and the phone
 * sheet (Law 11): which frame a job and the person's place draw, which step that is, why a step's
 * act waits, the mapping the device proposes, and which act each question's card offers.
 */

/** How often the wizard reads a job while it is read, matched or run on the server. */
export const IMPORT_POLL_SECONDS = 2;

export const IMPORT_WIZARD_STEPS = ['file', 'columns', 'preview', 'report'] as const;
export type ImportWizardStep = (typeof IMPORT_WIZARD_STEPS)[number];

/** What the wizard draws: a step, or a wait or a state on the way through one. */
export type ImportWizardFrame =
  | 'empty'
  | 'reading'
  | 'unreadable'
  | 'file'
  | 'columns'
  | 'matching'
  | 'preview'
  | 'running'
  | 'report';

const STEP_OF_FRAME: Readonly<Record<ImportWizardFrame, ImportWizardStep>> = {
  empty: 'file',
  reading: 'file',
  unreadable: 'file',
  file: 'file',
  columns: 'columns',
  matching: 'columns',
  preview: 'preview',
  running: 'report',
  report: 'report',
};

/** The zero-based step the head names: *Step N of 4*. */
export function importWizardStepIndex(frame: ImportWizardFrame): number {
  return IMPORT_WIZARD_STEPS.indexOf(STEP_OF_FRAME[frame]);
}

/**
 * Where the person stands apart from the job: a step they went back to (`at`), or the open rows of
 * a completed job they took back into the preview (`fixing`, *Fix the N rows*).
 */
export interface ImportWizardView {
  readonly at: 'file' | 'columns' | null;
  readonly fixing: boolean;
}

export const IMPORT_WIZARD_START: ImportWizardView = { at: null, fixing: false };

export type ImportWizardEvent =
  | { readonly type: 'continued' }
  | { readonly type: 'mapped' }
  | { readonly type: 'back' }
  | { readonly type: 'fix_opened' }
  | { readonly type: 'ran' }
  | { readonly type: 'replaced' };

/** The frame a job's state draws, unless the person went back to an earlier step. */
export function importWizardFrame(
  status: CatalogImportState | null,
  view: ImportWizardView,
): ImportWizardFrame {
  switch (status) {
    case null:
      return 'empty';
    case 'reading':
      return 'reading';
    case 'unreadable':
      return 'unreadable';
    case 'mapped':
      return view.at ?? 'file';
    case 'matching':
      return view.at ?? 'matching';
    case 'previewed':
      return view.at ?? 'preview';
    case 'running':
      return 'running';
    default:
      // `completed`, and any state a later server adds past the run.
      return view.fixing ? 'preview' : 'report';
  }
}

/**
 * Which lists a frame reads: the preview's, the preview's narrowed to the rows a completed run left
 * open (*Fix the N rows*), the report's, or none.
 */
export function importListStep(
  frame: ImportWizardFrame,
  status: CatalogImportState | null,
): 'preview' | 'fix' | 'report' | null {
  if (frame === 'report') return 'report';
  if (frame !== 'preview') return null;
  return status === 'completed' ? 'fix' : 'preview';
}

/** Back from the wait or the preview returns to the columns: the mapping is what changes there. */
const BACK_FROM: Partial<Record<ImportWizardFrame, ImportWizardView['at']>> = {
  columns: 'file',
  matching: 'columns',
  preview: 'columns',
};

export function importWizardViewAfter(
  view: ImportWizardView,
  frame: ImportWizardFrame,
  event: ImportWizardEvent,
): ImportWizardView {
  switch (event.type) {
    case 'continued':
      return frame === 'file' ? { at: 'columns', fixing: false } : view;
    case 'back':
      if (view.fixing) return IMPORT_WIZARD_START;
      return frame in BACK_FROM ? { at: BACK_FROM[frame] ?? null, fixing: false } : view;
    case 'fix_opened':
      return { at: null, fixing: true };
    case 'mapped':
    case 'ran':
    case 'replaced':
      return IMPORT_WIZARD_START;
  }
}

/** Why a step's *Continue* waits, said in its `disabledReason`; `null` when it may go on. */
export type ImportContinueGate =
  | 'no_file'
  | 'reading'
  | 'unreadable'
  | 'columns_unplaced'
  | 'columns_twice'
  | 'matching';

const COLUMNS_GATE: Readonly<Record<CatalogImportColumnsProblem, ImportContinueGate>> = {
  required_field_unplaced: 'columns_unplaced',
  field_placed_twice: 'columns_twice',
};

export function importContinueGate(
  frame: ImportWizardFrame,
  columns: readonly (CatalogImportField | null)[],
): ImportContinueGate | null {
  switch (frame) {
    case 'empty':
      return 'no_file';
    case 'reading':
    case 'unreadable':
    case 'matching':
      return frame;
    case 'columns': {
      const problem = importColumnsProblem(columns);
      return problem === null ? null : COLUMNS_GATE[problem];
    }
    default:
      return null;
  }
}

/** One sheet's header row as cells, one per column the sheet fills. */
function headerCells(sheet: CatalogImportSheet, headerRow: number): readonly string[] {
  const row = sheet.topRows[headerRow] ?? [];
  return Array.from({ length: sheet.columnCount }, (_, column) => row[column] ?? '');
}

/** The columns guessed from one header row of one sheet. */
export function mappingForHeader(
  sheets: readonly CatalogImportSheet[],
  sheet: number,
  headerRow: number,
): CatalogImportMapping {
  const read = sheets[sheet];
  const cells = read === undefined ? [] : headerCells(read, headerRow);
  return { sheet, headerRow, columns: guessColumns(cells).map((guess) => guess.field) };
}

/**
 * What the device proposes once a file is read: the first sheet whose top names a field ("We read
 * the one with a header row"), else the first sheet; its best header row; and its columns.
 */
export function guessImportMapping(
  sheets: readonly CatalogImportSheet[],
): CatalogImportMapping | null {
  if (sheets.length === 0) return null;
  const guesses = sheets.map((sheet, index) =>
    mappingForHeader(sheets, index, guessHeaderRow(sheet.topRows)),
  );
  const named = guesses.find((guess) => guess.columns.some((field) => field !== null));
  return named ?? guesses[0] ?? null;
}

/** The outcomes each preview group lists: a match on the company's own SKU is counted a match. */
export const IMPORT_PREVIEW_GROUPS = {
  overrides: ['price_override', 'own_item_price'],
  newItems: ['new_item'],
  attention: ['needs_attention'],
} as const satisfies Readonly<Record<string, readonly CatalogImportRowOutcome[]>>;

/** The outcomes a run writes: the rows *Import N rows* counts. */
export const IMPORT_READY_OUTCOMES = [
  ...IMPORT_PREVIEW_GROUPS.overrides,
  ...IMPORT_PREVIEW_GROUPS.newItems,
] as const satisfies readonly CatalogImportRowOutcome[];

/** The results each report group lists. */
export const IMPORT_REPORT_GROUPS = {
  imported: ['price_applied', 'product_created'],
  applied: ['price_applied'],
  created: ['product_created'],
  leftOut: ['left_out'],
  failed: ['failed'],
} as const satisfies Readonly<Record<string, readonly CatalogImportRowResult[]>>;

/** The N of *Import N rows*: every row the run will write. */
export function importReadyCount(counts: CatalogImportCounts): number {
  return counts.matched + counts.newItems;
}

/** A row with several reasons asks one question at a time, in the vocabulary's order. */
export function firstAttentionReason(
  attention: readonly { readonly reason: CatalogImportAttentionReason }[],
): CatalogImportAttentionReason | null {
  return (
    CATALOG_IMPORT_ATTENTION_REASONS.find((reason) =>
      attention.some((entry) => entry.reason === reason),
    ) ?? null
  );
}

/** The act a question's card offers in place; `none` asks, and only *Leave out* answers. */
export type ImportFixAct = 'price' | 'answer' | 'pick' | 'kind' | 'repeat' | 'none';

const FIX_ACT: Readonly<Record<CatalogImportAttentionReason, ImportFixAct>> = {
  brand_or_model_missing: 'none',
  kind_missing: 'kind',
  price_missing: 'price',
  price_unreadable: 'price',
  price_below_zero: 'price',
  price_finer_than_minor_unit: 'price',
  spec_missing: 'none',
  spec_invalid: 'none',
  spec_conflict: 'answer',
  several_matches: 'pick',
  repeated_in_file: 'repeat',
};

/**
 * A repeat is answered by leaving out the earlier row, which a completed job's run has already
 * written — so there, only *Leave out* answers it.
 */
export function importFixAct(
  reason: CatalogImportAttentionReason,
  status: CatalogImportState,
): ImportFixAct {
  const act = FIX_ACT[reason];
  return act === 'repeat' && status !== 'previewed' ? 'none' : act;
}
