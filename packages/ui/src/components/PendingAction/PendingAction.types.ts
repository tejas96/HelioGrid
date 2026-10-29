import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';

export type PendingActionState = 'waiting' | 'returned';
export type PendingActionAlign = 'left' | 'right';

/**
 * **A row saying "this is being done"** — the third thing a row can say, after "done" and "not
 * done" (`M02-67` P0, `SCR-M02-02`, `SCR-M08-01`, `SCR-M02-06`).
 *
 * `F8-36` — the product *"does not silently queue, partially apply, or display an optimistic
 * result"* — makes the gap between a tap and its confirmation a state the surface must render. The
 * treatment is **light and in-row, never a blocking overlay or a spinner wall** (`F4-27`).
 *
 * **Visibly pending AND still operable.** It adds a line and changes nothing else: no opacity, no
 * row tint, no pointer-events change, no `aria-invalid`. Hosts set `aria-busy` on the row and
 * leave it operable.
 */
interface PendingActionOwnSpec {
  /**
   * **The act being awaited, named** — "Assigning to Priya Sharma", "Moving to Installation".
   * Present tense, because it is happening. This is the prop `Button loading` has no equivalent
   * of: it replaces its label with a spinner, deleting the name of the thing the reader is
   * waiting on.
   */
  label?: ReactNode;
  /**
   * `waiting` (default) — the tap has left the device and the server has not confirmed.
   * `returned` — it came back undone. The row is already back to what it was (nothing was
   * optimistically applied, `F8-36`), and this line says why.
   */
  state?: PendingActionState;
  /**
   * **Why it came back — a whole sentence**, naming the act that did not happen as well as the
   * cause: *"Not assigned — Priya Sharma has left the team."* A reason that names only the cause
   * leaves the reader to work out which of a row's four acts it belongs to. Required for
   * `returned`; ignored otherwise.
   */
  reason?: ReactNode;
  /**
   * `M02-24`'s three-second budget, said in words once it is exceeded — "Taking longer than
   * usual." The rail never changes speed to imply it: a slower animation is not a sentence.
   */
  slowNote?: ReactNode;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  /** Floor is 12px (the type floor). Default 12. */
  size?: number;
  align?: PendingActionAlign;
}

/** A returned line that stays, with no act — correct for a failure the reader must see. */
interface PendingActionKept {
  onRetry?: undefined;
  onDismiss?: undefined;
  dismissLabel?: undefined;
  focusAfter?: undefined;
}

/**
 * Where focus lands once the line has gone (`F7-23` N5) — cleared, or taken away with a retry. A
 * retry the line outlives (the act out again, `waiting`) keeps the focus on the line.
 */
interface PendingActionLeaving {
  focusAfter: FocusAfter;
}

/** A returned line the reader may only try again. */
interface PendingActionRetried extends PendingActionLeaving {
  /** A 44px retry on a returned act. The act is the caller's to re-fire, not the row's. */
  onRetry: () => void;
  onDismiss?: undefined;
  dismissLabel?: undefined;
}

/**
 * A returned line the reader may clear — right for a list they keep working in, so most callers
 * pass it — and may try again.
 */
interface PendingActionClearable extends PendingActionLeaving {
  /** A 44px retry on a returned act. The act is the caller's to re-fire, not the row's. */
  onRetry?: () => void;
  /** Clears the returned line. */
  onDismiss: () => void;
  /** The clearing button's words, from `packages/i18n`. */
  dismissLabel: TranslatedText;
}

export type PendingActionSpec = PendingActionOwnSpec &
  (PendingActionKept | PendingActionRetried | PendingActionClearable);

export type PendingActionProps = PendingActionSpec;

/**
 * The travelling segment on its own — an operation whose end is not known. Under
 * `prefers-reduced-motion` it renders a static dimmed full-width fill rather than freezing at 34%,
 * which would read as a determinate third.
 */
export interface IndeterminateRailProps {
  width?: number | string;
  thickness?: number;
  tone?: string;
}
