import { useEffect, useRef, useState } from 'react';

export interface ActivityWindow {
  /** How many of the sorted entries the list draws right now. */
  shown: number;
  reveal: (step: number) => void;
}

/**
 * THE WINDOW AND THE SERVER PAGE ARE TWO DIFFERENT EVENTS, and one reset effect used to treat them
 * as one: keying on `entries.length` alone fired on an APPEND too, snapping the window back to 25,
 * so an indefinite ladder (`SCR-M12-02`) pressed "Show more", the parent appended page 2, and the
 * same newest 25 re-rendered — the server-paging path was dead.
 *
 * Now: a narrowing (a filter) resets the window, a growth (a page arriving) raises it to cover what
 * was handed over, and `visibleCount` changing is still the caller's own reset.
 */
export function useActivityWindow(entriesLength: number, visibleCount: number): ActivityWindow {
  const [shown, setShown] = useState(visibleCount);
  const previousLength = useRef(entriesLength);

  useEffect(() => {
    setShown(visibleCount);
  }, [visibleCount]);

  useEffect(() => {
    const previous = previousLength.current;
    previousLength.current = entriesLength;
    if (entriesLength > previous) setShown((n) => Math.max(n, entriesLength));
    else if (entriesLength < previous) setShown(visibleCount);
  }, [entriesLength, visibleCount]);

  return { shown, reveal: (step: number) => setShown((n) => n + step) };
}
