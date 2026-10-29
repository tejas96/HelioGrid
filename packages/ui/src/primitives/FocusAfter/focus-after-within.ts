import type { RefObject } from 'react';
import type { FocusAfter } from './FocusAfter.types';

/**
 * The web's `focusAfter` for a part the page holds no ref to — the chosen segment of a switch, the
 * control a drop surface draws — found under `root` by `selector` only when focus is sent, since
 * which element that is changes with the page.
 */
export function focusAfterWithin(
  root: RefObject<HTMLElement | null>,
  selector: string,
): FocusAfter {
  return {
    current: {
      focus: (options) => root.current?.querySelector<HTMLElement>(selector)?.focus(options),
    },
  };
}
