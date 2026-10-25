import { type RefObject, useLayoutEffect, useRef, useState } from 'react';

/**
 * The sheet's own laid-out height, in design px, while `fit="content"` gives it none. A CSS scale
 * leaves the layout box at its unscaled height, so a window sized by layout alone crops a sheet
 * drawn wider than its design width and leaves a gap under a narrower one; the window takes this
 * height times the scale instead. `undefined` while the sheet has a stated height, before the first
 * measure, and while `ResizeObserver` is missing.
 */
export function useSheetHeight(
  measured: boolean,
): readonly [RefObject<HTMLDivElement | null>, number | undefined] {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const sheet = ref.current;
    if (!measured || sheet === null || typeof ResizeObserver === 'undefined') return;
    const read = () => setHeight(sheet.offsetHeight);
    const observer = new ResizeObserver(read);
    observer.observe(sheet);
    read();
    return () => observer.disconnect();
  }, [measured]);
  return [ref, measured ? height : undefined] as const;
}
