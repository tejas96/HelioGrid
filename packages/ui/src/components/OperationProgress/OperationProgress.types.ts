import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

export type OperationStageState = 'done' | 'active' | 'waiting';

export interface OperationStage {
  label: TranslatedText;
  /** `done` · `active` · `waiting`. Defaults to `active` for the first stage, `waiting` after. */
  state?: OperationStageState;
}

/**
 * **What a cancel actually stops.** Required alongside `onCancel`, and an omitted one renders no
 * cancel at all (plus a console warning) — the same shape as `UsageMeter`'s *no denominator
 * without a rate*. `importing-progress` states that *"a connection drop mid-import continues
 * server-side"*, so a button labelled "Cancel" on an import is a lie about a 400-row write.
 */
export type CancelEffect = 'stops-the-work' | 'stops-watching';

/**
 * The state of the **work**, not of a surface — deliberately not `SurfaceState`: a panel hosting
 * this can itself be `loading` or `error` while the job inside it is `running`.
 */
export type OperationState = 'running' | 'done' | 'failed' | 'cancelled';

/**
 * block = the bar with its words · inline = one line · **ring** = a round progress ring with the
 * count's done figure inside and its total under it (`SCR-M01-17`'s run): needs `count`.
 */
export type OperationProgressSize = 'block' | 'inline' | 'ring';

export interface OperationCount {
  done: number;
  total: number;
}

/** A cancel's two words: the button, and the sentence that says what it stops. */
export interface CancelWords {
  label: TranslatedText;
  note: TranslatedText;
}

/**
 * Every word the progress composes itself, in the reader's language — `@heliogrid/i18n`'s
 * `operationProgressWords(t)`. The figures in them arrive formatted by the market's pack.
 */
export interface OperationProgressWords {
  /** Each cancel effect's button and its honest sentence (`CancelEffect`). */
  cancel: Readonly<Record<CancelEffect, CancelWords>>;
  /** The count under the rail — *142 of 400 rows*; `unit` is the caller's. */
  count: (done: string, total: string, unit?: string) => TranslatedText;
  /** The step in the narration — *Step 2 of 3*. */
  step: (index: number, total: number) => TranslatedText;
  /** The phone's indeterminate rail, named — *Importing leads, in progress*. */
  inProgress: (label: string) => TranslatedText;
  /** Each stage's state, said after its name to a screen reader — *done*, *running*, *not started*. */
  stageState: Readonly<Record<OperationStageState, TranslatedText>>;
  /** A stage and its state as one name, where the phone reads a row whole — *Reading the roof, done*. */
  stageSpoken: (label: string, state: string) => TranslatedText;
}

export interface OperationProgressProps {
  /** The work, named. "Computing solar access", "Importing leads — Nashik list.csv". */
  label: TranslatedText;
  /** The progress's own words — `operationProgressWords(t)`. */
  words: OperationProgressWords;
  /**
   * 0–100. **`null` or omitted means indeterminate** and is a real distinction: the rail becomes a
   * travelling segment, no percentage is printed, and `role="progressbar"` carries no
   * `aria-valuenow`. A bar with an invented number on it is a claim.
   */
  value?: number | null;
  /** "142 of 400 rows" — `M02-21`'s row-by-row import. Printed in mono, under the rail. */
  count?: OperationCount | null;
  /** What the count counts — *rows*. */
  unit?: TranslatedText;
  /** The stage in words (`M05-45`, `MS2-38`). A percentage says how far; only words say what. */
  stage?: ReactNode;
  stageIndex?: number;
  stageTotal?: number;
  /** `MS2-38`'s three narrated steps, when the caller has all of them, with a state each. */
  stages?: OperationStage[];
  state?: OperationState;
  /** The finishing sentence: the report line, the failure, or what a cancel left behind. */
  message?: ReactNode;
  /** `M02-21`'s promise, said where the person is — "You can leave this screen; it keeps running." */
  leaveNote?: ReactNode;
  onCancel?: () => void;
  cancelEffect?: CancelEffect;
  /** Replaces the effect's own button word (`words.cancel`). */
  cancelLabel?: TranslatedText;
  /** Overrides the generated sentence naming what the cancel stops. Never removes it. */
  cancelNote?: ReactNode;
  onRetry?: () => void;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  /**
   * **Where the finished thing is** — a real control, not a word: "Open the failure report",
   * "Open the heatmap". A watched computation may have none, because you are already looking at
   * its subject; a job you left always does (see `JobTray`).
   */
  destination?: ReactNode;
  /** Brand gradient fill for AI / studio computation, per the one-accent-gesture rule. */
  gradient?: boolean;
  /** `block` (default), `inline` — smaller label, tighter rhythm, for a tray row or a cell — or `ring`. */
  size?: OperationProgressSize;
  /**
   * `ring` only: the words under the done figure inside the ring — *of 405 rows* — from the caller,
   * plural and language its own. `label` stays the ring's accessible name.
   */
  countCaption?: TranslatedText;
}
