import { type RefObject, useEffect } from 'react';

/**
 * A field the caller asks to take focus — the first one a refused form names (`F7-26`): each new
 * `request` focuses the control once. `undefined` and `0` ask nothing, so a field that is never
 * asked never moves the page.
 */
export function useFocusRequest(
  control: RefObject<{ focus(): void } | null>,
  request: number | undefined,
): void {
  useEffect(() => {
    if (request === undefined || request === 0) return;
    control.current?.focus();
  }, [control, request]);
}
