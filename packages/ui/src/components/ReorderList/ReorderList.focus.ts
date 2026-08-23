/* WHERE FOCUS GOES once the caller's new order has landed — platform-neutral, over whatever element
   type each half registers, so web and native walk the list in exactly the same order.

   After a MOVE: the button that was pressed, WHICH TRAVELS WITH THE ROW. If that button is now
   aria-disabled (the row reached an end) the OPPOSITE arrow of the same row takes it.

   After a DELETE: the delete button of the row that took its place — or, when that row is LOCKED
   and therefore has no delete button, that row's own move arrow, then the nearest delete either
   side. Landing on the list mid-flow is what all three teaching surfaces say never happens. */

import type { MoveDirection } from './ReorderList.defaults';

export type ControlSuffix = MoveDirection | 'delete';

/** The order a delete falls back through one row's own controls. */
const ROW_FALLBACK: readonly ControlSuffix[] = ['delete', 'down', 'up'];

/** The key one row's control is registered under. Both halves register and read through this. */
export function controlId(key: string | number, suffix: ControlSuffix): string {
  return `${key}:${suffix}`;
}

/**
 * Looks a control up by its id and returns it ONLY when it can take focus. A control the end of the
 * list has aria-disabled has something to say — it does not receive focus.
 */
export type FocusableControl<E> = (id: string) => E | null;

/** The pressed arrow, then the opposite arrow of the same row. */
export function moveFocusTarget<E>(
  key: string | number,
  dir: MoveDirection,
  canFocus: FocusableControl<E>,
): E | null {
  return (
    canFocus(controlId(key, dir)) ?? canFocus(controlId(key, dir === 'up' ? 'down' : 'up')) ?? null
  );
}

/** The first control of one row that can take focus. */
function rowFocusTarget<E>(
  key: string | number | undefined,
  canFocus: FocusableControl<E>,
): E | null {
  if (key === undefined) {
    return null;
  }
  for (const suffix of ROW_FALLBACK) {
    const el = canFocus(controlId(key, suffix));
    if (el) {
      return el;
    }
  }
  return null;
}

/** The row that took the deleted index, then the nearest row either side of it. */
export function deleteFocusTarget<E>(
  keys: readonly (string | number)[],
  index: number,
  canFocus: FocusableControl<E>,
): E | null {
  const idx = Math.min(index, keys.length - 1);
  let el = rowFocusTarget(keys[idx], canFocus);
  for (let d = 1; !el && d < keys.length; d++) {
    el = rowFocusTarget(keys[idx - d], canFocus) ?? rowFocusTarget(keys[idx + d], canFocus);
  }
  return el;
}
