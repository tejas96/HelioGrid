'use client';
import { useEffect, useRef } from 'react';

/**
 * Command K (Ctrl K off a Mac) opens the search from anywhere in the shell — the folded rail and the
 * pages without the sidebar's field too, so the key never depends on the field being drawn.
 */
export function useSearchKeys(open: () => void): void {
  const latest = useRef(open);
  latest.current = open;
  useEffect(() => {
    const bring = (event: KeyboardEvent) => {
      if (event.key?.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      latest.current();
    };
    document.addEventListener('keydown', bring);
    return () => document.removeEventListener('keydown', bring);
  }, []);
}
