import { useLayoutEffect, useRef } from 'react';

const PER_CENT = 100;

/**
 * Places an element along a line by its share of it, 0 to 1: the web's half, which sets the
 * stylesheet's `--hg-at` on the node, as the marks on the roofs are placed.
 */
export function useShareAt<T extends HTMLElement>(share: number) {
  const node = useRef<T>(null);
  useLayoutEffect(() => {
    node.current?.style.setProperty('--hg-at', `${Math.min(1, Math.max(0, share)) * PER_CENT}%`);
  }, [share]);
  return node;
}
