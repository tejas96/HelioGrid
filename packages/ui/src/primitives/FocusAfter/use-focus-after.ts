import { useEffect, useRef } from 'react';
import type { FocusAfter, LeavingPress } from './FocusAfter.types';

/**
 * A control that removes itself wraps its press with this. When the control leaves the page after
 * a press and the focus left with it, the focus moves to `focusAfter` once the next frame has drawn
 * it — without scrolling. A control that stays (the retry failed again) keeps the focus, and focus
 * the person already moved elsewhere is never taken back.
 */
/** After the next frame, focus `focusAfter` — only when the focus left with the control. */
export function landFocusOn(focusAfter: FocusAfter): void {
  requestAnimationFrame(() => {
    const focusLost = document.activeElement === null || document.activeElement === document.body;
    if (focusLost) focusAfter.current?.focus({ preventScroll: true });
  });
}

export function useFocusAfter(focusAfter: FocusAfter): LeavingPress {
  const target = useRef(focusAfter);
  target.current = focusAfter;
  const pressed = useRef(false);
  useEffect(
    () => () => {
      if (pressed.current) landFocusOn(target.current);
    },
    [],
  );
  return (press) => () => {
    pressed.current = true;
    press();
  };
}
