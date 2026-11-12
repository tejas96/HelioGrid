import type { KeyboardEvent } from 'react';

/**
 * Web halves only: Enter and Space press an element that carries the button role, as they press a
 * native button. A pressable surface that holds other content cannot be a `button` element, so it
 * takes the role and this.
 */
export function pressOnEnterOrSpace(onPress: () => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPress();
    }
  };
}

/** Which arrows walk a group: a row walks with left and right; a grid or a stack with all four. */
export type RovingAxis = 'row' | 'both';

const STEP_OF_KEY: Readonly<Record<RovingAxis, Readonly<Record<string, 1 | -1>>>> = {
  row: { ArrowRight: 1, ArrowLeft: -1 },
  both: { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 },
};

/**
 * Web halves only: where a key moves the focus inside a group with one tab stop (a radio group, a
 * tab row). The arrows step and wrap round, Home and End go to the ends, and an item `skipped`
 * names is passed over in the direction of travel. `null` when the key does not walk the group, so
 * the caller leaves the key to the browser.
 */
export function rovingTargetOf(
  key: string,
  at: number,
  count: number,
  axis: RovingAxis,
  skipped: (index: number) => boolean = () => false,
): number | null {
  const start =
    key === 'Home' ? { to: 0, step: 1 } : key === 'End' ? { to: count - 1, step: -1 } : null;
  const step = STEP_OF_KEY[axis][key];
  const from = start ?? (step === undefined ? null : { to: at + step, step });
  if (from === null || count === 0) return null;
  let target = (from.to + count) % count;
  for (let guard = 1; guard < count && skipped(target); guard += 1) {
    target = (target + from.step + count) % count;
  }
  return target;
}
