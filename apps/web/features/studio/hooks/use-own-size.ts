'use client';
import { type RefObject, useEffect, useRef, useState } from 'react';

/**
 * An element's whole size in CSS pixels — its border box, padding and edge included — kept as it
 * changes; `null` until first measured.
 */
export function useOwnSize<T extends HTMLElement>(): readonly [
  RefObject<T | null>,
  { readonly width: number; readonly height: number } | null,
] {
  const ref = useRef<T>(null);
  // biome-ignore lint/plugin: the browser's measure of one element is the platform's own fact, not screen state
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const watch = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize[0];
      if (box === undefined) return;
      const width = box.inlineSize;
      const height = box.blockSize;
      setSize((was) =>
        was !== null && was.width === width && was.height === height ? was : { width, height },
      );
    });
    watch.observe(element);
    return () => watch.disconnect();
  }, []);
  return [ref, size] as const;
}
