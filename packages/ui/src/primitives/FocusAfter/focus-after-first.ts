import type { FocusAfter } from './FocusAfter.types';

/**
 * `first` while it is still on the page when focus lands, else `then` — for a part that may leave
 * with its control (a returned line that a retry takes away, where a row's line stays).
 */
export function focusAfterFirst(first: FocusAfter, then: FocusAfter): FocusAfter {
  return {
    get current() {
      return first.current ?? then.current;
    },
  };
}
