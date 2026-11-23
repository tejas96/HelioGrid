'use client';
import { type RefObject, useEffect, useRef } from 'react';

/**
 * A press outside a part that is open (a platform adapter): it runs `onAway`. A press inside the
 * part is not away, nor one inside `keep` — the control that opened the part, which closes it
 * itself.
 */
export function usePressAway(
  part: RefObject<HTMLElement | null>,
  open: boolean,
  onAway: () => void,
  /** A selector of what else is not away. */
  keep?: string,
): void {
  const latest = useRef(onAway);
  latest.current = onAway;
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      const at = event.target;
      if (!(at instanceof Element) || part.current?.contains(at)) return;
      if (keep !== undefined && at.closest(keep) !== null) return;
      latest.current();
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [open, part, keep]);
}
