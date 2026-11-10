import {
  type ImportContinueGate,
  type ImportWizardFrame,
  importStepGate,
} from '../catalog/import-wizard';
import { type LeadImportField, leadImportColumnsProblem } from './lead-import-fields';
import { LEAD_IMPORT_PROBLEMS, type LeadImportProblem } from './lead-import-rows';
import type { ImportDuplicateChoice } from './vocabulary';

/**
 * The Lead Import Wizard (`SCR-M02-05`, `M02-18`…`M02-21`) as both screens draw it: the counts
 * before anything runs, what the run will do with the one duplicate choice, what happens to each
 * row, the run's progress and the report's figures. Pure; the frames and their moves are the
 * shared import wizard's (`catalog/import-wizard`), which every import draws.
 */

/** The preview's counts, as the job carries them once its rows are judged. */
export interface LeadImportCounts {
  readonly rows: number;
  readonly duplicates: number;
  readonly rejected: number;
}

/** "400 rows · 90 duplicates by phone" (`M02-19`), and the rows that land as new leads. */
export interface LeadImportFigures extends LeadImportCounts {
  /** Neither a duplicate nor rejected: each lands as a new lead, whatever the duplicate choice. */
  readonly create: number;
}

export function leadImportFiguresOf(counts: LeadImportCounts | null): LeadImportFigures | null {
  if (counts === null) return null;
  return { ...counts, create: Math.max(0, counts.rows - counts.duplicates - counts.rejected) };
}

/** What the run will do: the leads it creates, and the enquiries it logs when that is the choice. */
export interface LeadImportRunPlan {
  readonly create: number;
  readonly log: number;
}

export function leadImportRunPlanOf(
  figures: LeadImportFigures,
  choice: ImportDuplicateChoice,
): LeadImportRunPlan {
  return { create: figures.create, log: choice === 'log_enquiry' ? figures.duplicates : 0 };
}

/** Why *Import* waits on the preview: a run that would create nothing and log nothing. */
export type LeadImportRunGate = 'nothing_to_import';

export function leadImportRunGate(plan: LeadImportRunPlan): LeadImportRunGate | null {
  return plan.create === 0 && plan.log === 0 ? 'nothing_to_import' : null;
}

/**
 * Why a step's act waits before the preview: the frame's own wait, or the columns — the phone
 * unplaced, or a field placed twice (`leadImportColumnsProblem`, the rule the server refuses by).
 */
export function leadImportGate(
  frame: ImportWizardFrame,
  columns: readonly (LeadImportField | null)[],
): ImportContinueGate | null {
  return importStepGate(frame, frame === 'columns' ? leadImportColumnsProblem(columns) : null);
}

/** The report's figures (`M02-21`): the leads that landed, the duplicates, the rows rejected. */
export interface LeadImportResults {
  readonly landed: number;
  readonly logged: number;
  readonly skipped: number;
  readonly rejected: number;
}

export interface LeadImportOutcome extends LeadImportResults {
  /** Every row the run took: what landed, both kinds of duplicate, and the rejected. */
  readonly read: number;
  /** The duplicates by phone, whichever the choice made of them. */
  readonly duplicates: number;
}

export function leadImportOutcomeOf(results: LeadImportResults): LeadImportOutcome {
  const duplicates = results.logged + results.skipped;
  return { ...results, duplicates, read: results.landed + duplicates + results.rejected };
}

/** The run's place: rows taken of the rows read, and its share, never past the whole. */
export interface LeadImportProgress {
  readonly done: number;
  readonly total: number;
  /** 0 to 1. */
  readonly share: number;
}

export function leadImportProgressOf(run: {
  readonly done: number;
  readonly total: number;
}): LeadImportProgress {
  const done = Math.min(run.done, run.total);
  return { done, total: run.total, share: run.total === 0 ? 0 : done / run.total };
}

/**
 * What happens to one row — in the preview, what the run will do with it under the choice; once
 * run, what it did (`M02-20`, `M02-21`). A row repeating an earlier row of the file follows the
 * duplicate choice once the first has landed.
 */
export type LeadImportRowFate =
  | 'new_lead'
  | 'will_skip'
  | 'will_log'
  | 'rejected'
  | 'landed'
  | 'logged'
  | 'skipped';

/** A row as the preview judged it and the run left it; a word a later server adds reads as rejected. */
export interface LeadImportRowFacts {
  readonly verdict: string;
  readonly result: string | null;
}

const RESULT_FATES: Readonly<Record<string, LeadImportRowFate>> = {
  landed: 'landed',
  logged: 'logged',
  skipped: 'skipped',
};

export function leadImportRowFateOf(
  row: LeadImportRowFacts,
  choice: ImportDuplicateChoice,
): LeadImportRowFate {
  if (row.result !== null) return RESULT_FATES[row.result] ?? 'rejected';
  if (row.verdict === 'new') return 'new_lead';
  if (row.verdict === 'duplicate') return choice === 'skip' ? 'will_skip' : 'will_log';
  return 'rejected';
}

/** The parts the preview's rows can be narrowed to; none narrows to every row. */
export const LEAD_IMPORT_ROW_SCOPES = ['new', 'duplicate', 'rejected'] as const;
export type LeadImportRowScope = (typeof LEAD_IMPORT_ROW_SCOPES)[number];

/**
 * The rows a list reads: the preview's every row or one verdict's; the report's, the rejected rows
 * — each with its reason (`M02-21`) — since what landed is counted, and lives in the Inbox.
 */
export function leadImportRowsAskOf(
  phase: 'preview' | 'report',
  scope: LeadImportRowScope | null,
): { readonly verdict?: LeadImportRowScope; readonly result?: 'rejected' } {
  if (phase === 'report') return { result: 'rejected' };
  return scope === null ? {} : { verdict: scope };
}

/** One row as the preview pages it and the run leaves it, over the facts a duplicate carries. */
export interface LeadImportRowInput<Match extends { readonly lastContactAt: string | null }> {
  readonly rowNumber: number;
  /** The file's text by the field each column fills. */
  readonly cells: Readonly<Record<string, string>>;
  readonly verdict: string;
  readonly problems: readonly string[];
  readonly duplicateOf: Match | null;
  readonly repeatsRow: number | null;
  readonly result: string | null;
}

/** One row as both screens draw it: its fate, what it repeats or met, and why it cannot land. */
export interface LeadImportRowView<Match> {
  /** Its sheet row, as a list keys it. */
  readonly id: string;
  readonly rowNumber: number;
  readonly cells: Readonly<Record<string, string>>;
  readonly fate: LeadImportRowFate;
  /** The existing record the number met — its three facts; null when the row met none. */
  readonly match: Match | null;
  /** How long since that record's last contact; null when it has had none. */
  readonly lastContactAgoMs: number | null;
  /** The earlier row of the same file with this number, which lands first. */
  readonly repeatsRow: number | null;
  /** Every reason the row cannot land that this build knows, the number's first. */
  readonly problems: readonly LeadImportProblem[];
}

export function leadImportRowViewOf<Match extends { readonly lastContactAt: string | null }>(
  row: LeadImportRowInput<Match>,
  choice: ImportDuplicateChoice,
  nowEpoch: number,
): LeadImportRowView<Match> {
  const contactedAt = row.duplicateOf?.lastContactAt ?? null;
  return {
    id: String(row.rowNumber),
    rowNumber: row.rowNumber,
    cells: row.cells,
    fate: leadImportRowFateOf(row, choice),
    match: row.duplicateOf,
    lastContactAgoMs: contactedAt === null ? null : Math.max(0, nowEpoch - Date.parse(contactedAt)),
    repeatsRow: row.repeatsRow,
    problems: LEAD_IMPORT_PROBLEMS.filter((problem) => row.problems.includes(problem)),
  };
}
