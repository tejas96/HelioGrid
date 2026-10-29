import type { FocusAfter } from './FocusAfter.types';
import { landFocusOn } from './use-focus-after';

/**
 * For a part its component outlives — a mark the host stops drawing, a toast its host drops — so
 * no unmount can tell: wraps the press that closes it, and focus then lands on `focusAfter`. A
 * missing press stays missing.
 */
export function closingPress(focusAfter: FocusAfter) {
  return (press: (() => void) | undefined) =>
    press === undefined
      ? undefined
      : () => {
          press();
          landFocusOn(focusAfter);
        };
}
