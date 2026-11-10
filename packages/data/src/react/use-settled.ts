'use client';
import { useEffect, useState } from 'react';

/** Nothing typed, or only spaces: a read trims what it sends, so this asks the server nothing. */
function asksNothing(value: string | null): boolean {
  return value === null || value.trim() === '';
}

/**
 * `value` once the typing has rested for `waitMs`: a read follows a pause, never each key. A value
 * that asks nothing — `null`, empty, only spaces — settles in the same render, so a cleared field
 * shows its hint or its whole list without a wait and never reads the last word for one frame.
 */
export function useSettled<Value extends string | null>(value: Value, waitMs: number): Value {
  const [settled, setSettled] = useState(value);
  const blank = asksNothing(value);
  useEffect(() => {
    if (blank) {
      setSettled(value);
      return;
    }
    const rest = setTimeout(() => setSettled(value), waitMs);
    return () => clearTimeout(rest);
  }, [value, blank, waitMs]);
  return blank ? value : settled;
}
