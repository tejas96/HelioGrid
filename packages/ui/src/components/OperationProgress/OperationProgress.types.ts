import type { ReactNode } from 'react';

export type OperationStageState = 'done' | 'active' | 'waiting';

export interface OperationStage {
  label: string;
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

export type OperationProgressSize = 'block' | 'inline';

export interface OperationCount {
  done: number;
  total: number;
}

export interface OperationProgressProps {
  /** The work, named. "Computing solar access", "Importing leads — Nashik list.csv". */
  label: ReactNode;
  /**
   * 0–100. **`null` or omitted means indeterminate** and is a real distinction: the rail becomes a
   * travelling segment, no percentage is printed, and `role="progressbar"` carries no
   * `aria-valuenow`. A bar with an invented number on it is a claim.
   */
  value?: number | null;
  /** "142 of 400 rows" — `M02-21`'s row-by-row import. Printed in mono, under the rail. */
  count?: OperationCount | null;
  unit?: string;
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
  cancelLabel?: string;
  /** Overrides the generated sentence naming what the cancel stops. Never removes it. */
  cancelNote?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  /**
   * **Where the finished thing is** — a real control, not a word: "Open the failure report",
   * "Open the heatmap". A watched computation may have none, because you are already looking at
   * its subject; a job you left always does (see `JobTray`).
   */
  destination?: ReactNode;
  /** Brand gradient fill for AI / studio computation, per the one-accent-gesture rule. */
  gradient?: boolean;
  /** `block` (default) or `inline` — smaller label, tighter rhythm, for a tray row or a cell. */
  size?: OperationProgressSize;
}
