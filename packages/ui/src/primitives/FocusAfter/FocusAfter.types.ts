import type { RefObject } from 'react';

/**
 * What a caller holds to send focus to a control or a part: on the web the keyboard's focus (an
 * element is one), on the phone the screen reader's. Shared by every control that hands focus on.
 */
export interface FocusHandle {
  focus(options?: { preventScroll?: boolean }): void;
}

/**
 * Where focus lands once a control that removes itself has gone — *Try again*, *Undo*, *Dismiss*,
 * *Remove* (`F7-23` N5). Required on every such control: with none, the keyboard and the screen
 * reader fall to the page's start.
 */
export type FocusAfter = RefObject<FocusHandle | null>;

/** A control that does not remove itself names no target; its hook still runs, moving nothing. */
export const NO_FOCUS_AFTER: FocusAfter = { current: null };

/** Wraps a press so that, once the control has left, focus lands on its `focusAfter`. */
export type LeavingPress = (press: () => void) => () => void;
