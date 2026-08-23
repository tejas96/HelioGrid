import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

export interface SelectPlacement {
  /** The listbox rises above the trigger instead of dropping below it. */
  up: boolean;
  /** Tallest the listbox may be, in px, inside the space that is actually visible. */
  max: number;
}

const REST: SelectPlacement = { up: false, max: 260 };
const GAP = 12;
const MIN_BELOW = 160;
const CLIPPING = /(auto|scroll|hidden|clip)/;

/**
 * THE POPOVER FITS THE BOX IT IS IN. A cell editor lives inside `DataTable`'s `overflow: hidden`
 * shell, so "8px under the trigger, 260px tall" is simply invisible in the lower rows. The space
 * is MEASURED inside the nearest clipping ancestor rather than assumed, and the listbox drops,
 * rises or shortens to fit — no portal, no escaping the layout it lives in.
 */
export function useSelectPlacement(
  wrapRef: RefObject<HTMLDivElement | null>,
  open: boolean,
): SelectPlacement {
  const [place, setPlace] = useState<SelectPlacement>(REST);

  useEffect(() => {
    const el = wrapRef.current;
    if (!open || el === null || typeof window === 'undefined') {
      return;
    }
    const rect = el.getBoundingClientRect();
    let top = 0;
    let bottom = window.innerHeight;
    let parent = el.parentElement;
    while (parent !== null && parent !== document.body) {
      const computed = window.getComputedStyle(parent);
      if (CLIPPING.test(`${computed.overflow} ${computed.overflowY}`)) {
        const parentRect = parent.getBoundingClientRect();
        top = Math.max(top, parentRect.top);
        bottom = Math.min(bottom, parentRect.bottom);
        break;
      }
      parent = parent.parentElement;
    }
    const below = bottom - rect.bottom - GAP;
    const above = rect.top - top - GAP;
    const up = below < MIN_BELOW && above > below;
    setPlace({ up, max: Math.max(120, Math.min(260, up ? above : below)) });
  }, [open, wrapRef]);

  return place;
}
