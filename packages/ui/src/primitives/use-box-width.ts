import { type RefObject, useEffect, useRef, useState } from 'react';

/**
 * The width of an element's whole box (border and padding in), read at once and again as it
 * resizes — the space a frame or an overlay's layer gives what it holds. `useOwnWidth` reads the
 * content's room instead; the two differ by the box's padding, so a breakpoint keeps its own.
 * `null` until the first read.
 */
export function useBoxWidth<T extends HTMLElement = HTMLDivElement>(): [
  RefObject<T | null>,
  number | null,
] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }
    const read = () => setWidth(element.getBoundingClientRect().width);
    read();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
