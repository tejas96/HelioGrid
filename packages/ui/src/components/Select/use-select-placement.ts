import type { RefObject } from 'react';
import { useEffect, useState } from 'react';
import { LIST_MAX, type ListPlacement, listPlacement } from './Select.logic';

const REST: ListPlacement = { up: false, max: LIST_MAX };
const GAP = 12;
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
): ListPlacement {
  const [place, setPlace] = useState<ListPlacement>(REST);

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
    setPlace(listPlacement(below, above));
  }, [open, wrapRef]);

  return place;
}
