import { useEffect, useRef, useState } from 'react';
import type { CoachMarkAnchor } from './CoachMark.types';
import type { CoachMarkRect } from './coach-mark-place';

export interface AnchorRect extends CoachMarkRect {
  /** The anchor's own radius, so the ring follows the control rather than boxing it. */
  radius: string | number;
}

/** A ref, an element, or a CSS selector — resolved to a live element or to nothing. */
export function resolveNode(anchor?: CoachMarkAnchor): HTMLElement | null {
  if (anchor === undefined || typeof document === 'undefined') {
    return null;
  }
  if (typeof anchor === 'string') {
    const found = document.querySelector(anchor);
    return found instanceof HTMLElement ? found : null;
  }
  if ('current' in anchor) {
    const current: unknown = anchor.current;
    return current instanceof HTMLElement ? current : null;
  }
  return anchor instanceof HTMLElement ? anchor : null;
}

function readRadius(node: HTMLElement): string | number {
  try {
    return window.getComputedStyle(node).borderRadius || 14;
  } catch {
    return 14;
  }
}

/**
 * The anchor's live geometry. ANCHORS MOUNT LATE, PANELS OPEN, SCREENS SCROLL — polling is cheap
 * and survives all three, and scroll/resize keep it honest between polls. An anchor that never
 * resolves reports missing, and the mark draws nothing rather than pointing at nothing.
 */
export function useAnchorRect(
  anchor: CoachMarkAnchor | undefined,
  within: CoachMarkAnchor | undefined,
  active: boolean,
  onMissing?: () => void,
): AnchorRect | null {
  const [rect, setRect] = useState<AnchorRect | null>(null);
  const tries = useRef(0);
  const missingRef = useRef(onMissing);

  useEffect(() => {
    missingRef.current = onMissing;
  }, [onMissing]);

  useEffect(() => {
    if (!active || anchor === undefined || typeof document === 'undefined') {
      setRect(null);
      return;
    }
    tries.current = 0;
    let missed = false;
    const read = () => {
      const node = resolveNode(anchor);
      if (node === null) {
        tries.current += 1;
        setRect(null);
        if (tries.current > 2 && !missed) {
          missed = true;
          missingRef.current?.();
        }
        return;
      }
      const r = node.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setRect(null);
        return;
      }
      const box = resolveNode(within);
      const base: AnchorRect =
        box === null
          ? {
              top: r.top,
              left: r.left,
              width: r.width,
              height: r.height,
              vTop: r.top,
              bw: window.innerWidth,
              bh: window.innerHeight,
              radius: readRadius(node),
              box: false,
            }
          : {
              top: r.top - box.getBoundingClientRect().top + box.scrollTop,
              left: r.left - box.getBoundingClientRect().left + box.scrollLeft,
              width: r.width,
              height: r.height,
              vTop: r.top,
              bw: box.clientWidth,
              bh: box.clientHeight,
              radius: readRadius(node),
              box: true,
            };
      setRect(base);
    };
    read();
    const timer = window.setInterval(read, 250);
    window.addEventListener('scroll', read, true);
    window.addEventListener('resize', read);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('scroll', read, true);
      window.removeEventListener('resize', read);
    };
  }, [anchor, within, active]);

  return rect;
}
