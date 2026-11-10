import { type RefObject, useEffect, useRef, useState } from 'react';

/**
 * The width of an element's own room, measured — never the window's: beside the settings list or a
 * panel a part has only some of it (`packages/ui/CLAUDE.md`, Traps). `null` until the first measure,
 * and while `ResizeObserver` is missing.
 */
export function useOwnWidth<T extends HTMLElement = HTMLDivElement>(): readonly [
  RefObject<T | null>,
  number | null,
] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(contentWidthOf(element));
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * The room inside the element's padding — what `ResizeObserver`'s `contentRect` reports. The first
 * measure must read the same box as every later one, or a part at its breakpoint flips once the
 * observer answers.
 */
function contentWidthOf(element: HTMLElement): number {
  const style = getComputedStyle(element);
  return element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
}
