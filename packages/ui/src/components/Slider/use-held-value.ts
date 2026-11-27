import { useState } from 'react';

/**
 * The value a slider shows: while a finger, the mouse or a key holds it, where it is held; else
 * the value it was given. A caller that only saves on release (`onCommit`) gives no new value
 * while it is held, so the thumb would spring back under the finger and release the old value.
 */
export function useHeldValue(value: number) {
  const [held, setHeld] = useState<number | null>(null);
  return {
    shown: held ?? value,
    hold: (next: number) => setHeld(next),
    let: () => setHeld(null),
  };
}
