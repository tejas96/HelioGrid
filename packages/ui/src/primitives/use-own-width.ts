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
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
