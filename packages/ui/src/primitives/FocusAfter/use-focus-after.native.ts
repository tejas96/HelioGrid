import { useEffect, useRef } from 'react';
import { focusScreenReaderOn } from '../screen-reader-focus.native';
import type { FocusAfter, FocusHandle, LeavingPress } from './FocusAfter.types';

/** A host view can be measured; a component's own handle cannot, and moves the reader itself. */
function isHostView(target: FocusHandle): boolean {
  return 'measure' in target;
}

/**
 * The phone's half: when a control leaves after its press, the screen reader's focus moves to
 * `focusAfter` — a view the reader is sent to, or a handle that sends it. The keyboard's focus is
 * never moved, since that would open the soft keyboard over the page.
 */
/** Moves the screen reader to `focusAfter`: a view it is sent to, or a handle that sends it. */
export function landFocusOn(focusAfter: FocusAfter): void {
  const next = focusAfter.current;
  if (next === null) return;
  if (isHostView(next)) focusScreenReaderOn(() => focusAfter.current);
  else next.focus();
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
