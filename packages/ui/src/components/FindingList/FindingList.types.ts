import type { ReactNode } from 'react';
import type { PendingActionSpec } from '../PendingAction/PendingAction.types';

/** Three statuses, `M05-58`'s vocabulary: ready · needs attention · blocking. */
export type FindingStatus = 'ready' | 'attention' | 'blocking';

export interface Finding {
  id?: string | number;
  /** The check, named — "Three panels are not on a string". */
  title: ReactNode;
  /** **Its meaning in plain language** (`M05-58`). A check name is not a sentence. */
  meaning?: ReactNode;
  status?: FindingStatus;
  /** Overrides the status word on the row. The tone and rank stay the status's. */
  statusLabel?: string;
  /** Which check family it came from — `(a)`–`(f)` on the Generate gate. Quiet row label. */
  family?: ReactNode;
  /** The step that can fix it, for the composed jump label: "Fix in step 4". */
  step?: string;
  /** The jump. Lands on the exact step with the failing fields in `error` (`M06-23`). */
  onJump?: () => void;
  jumpLabel?: string;
  /** The second, inline one-tap fix — `MS6-27`'s "Auto-string now". Omit where there is none. */
  fix?: { label: ReactNode; onFix?: () => void };
  /** A tick that is a server write — the inline fix in flight, rendered by `PendingAction`. */
  pending?: PendingActionSpec | ReactNode;
}

export interface FindingVerdict {
  status: FindingStatus;
  label: string;
  total: number;
  openCount: number;
  blockingCount: number;
  attentionCount: number;
  readyCount: number;
  passes: boolean;
}

/** One row of the status table. `tone`/`bg`/`mark` are each platform's own colour vocabulary. */
export interface FindingStatusMeta {
  rank: number;
  label: string;
  tone: string;
  bg: string;
  mark: string;
  verdict: string;
}

/**
 * **The gate that lists every failure, counted, each with the act that fixes it.** `M06-23` (P0) /
 * `SCR-M06-02`'s `generate-failure-list`, `MS6-27` / `SCR-MS-08`'s tap-to-locate issue cards,
 * `M05-58`'s status + plain meaning + jump, `MS11-07`'s ordered items with a worst-of verdict.
 *
 * **Not `BannerStack`, and the reason is structural.** That component exists to *rank and suppress*
 * — `mode="single"` is "the broadest true fact speaks", `max` caps the rest — so it cannot be the
 * instrument that promises to list every failure. **Not `Timeline`** either: its rail is lit to the
 * current step, and a severity-ordered set of findings has no current step.
 *
 * **The count is the whole and is not a prop.** It is derived from `findings` every render, so
 * "Fix 5 issues to share" cannot disagree with the list beneath it. There is no `mode` and no `max`
 * — passing either warns in the console and is ignored.
 *
 * **The gate is idempotent** because the component holds no state about the set: no dismissal, no
 * seen flag, no local done-ness.
 */
export interface FindingListProps {
  findings: Finding[];
  /** The gated act, for the composed heading — "Fix 5 issues to **share**". */
  actionLabel?: string;
  /** Replaces the composed heading. **The count still comes from the list.** */
  title?: ReactNode;
  /**
   * `severity` (default) — blocking first, open items then ready ones. `given` — the caller's order
   * kept **across the whole set**: `MS11-07`'s four *ordered* items render 1,2,3,4 with the ready
   * ones **in place**, because `given` renders one list rather than an open list and a ready list.
   */
  order?: 'severity' | 'given';
  /**
   * The only fold in the component, and it reaches **ready items only**: `collapsed` (default —
   * counted in the header, listed behind a real control), `listed` (open), `counted` (**the number
   * only, no control**). Ready items are counted in the header in **every** mode, and no
   * arrangement of props can fold, cap or hide a finding that needs work.
   */
  readyMode?: 'collapsed' | 'listed' | 'counted';
  /** The worst-of verdict pill above the list. */
  verdict?: boolean;
  onJump?: (finding: Finding) => void;
  jumpLabel?: string;
  passTitle?: ReactNode;
  passMessage?: ReactNode;
  note?: ReactNode;
  density?: 'expressive' | 'functional';
}
