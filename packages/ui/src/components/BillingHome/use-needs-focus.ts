import { type Ref, useEffect, useImperativeHandle, useRef } from 'react';
import type { BillingHomeFocus } from './BillingHome.types';

/**
 * The body's focus handle, both halves: `focusNeeds` lands at once when the needs region is drawn,
 * else as soon as it is — a landed cancel refetches the page, and the region it lands on (`Needs
 * you`) may arrive only with the answer. `land` is the half's own way to move focus there;
 * `landPlan` lands on `Your plan`, which every ready page draws.
 */
export function useNeedsFocus(
  ref: Ref<BillingHomeFocus> | undefined,
  drawn: boolean,
  land: () => void,
  landPlan: () => void,
): void {
  const asked = useRef(false);
  const latest = useRef({ drawn, land, landPlan });
  latest.current = { drawn, land, landPlan };
  useImperativeHandle(
    ref,
    () => ({
      focusNeeds() {
        if (latest.current.drawn) latest.current.land();
        else asked.current = true;
      },
      focusPlan() {
        latest.current.landPlan();
      },
    }),
    [],
  );
  useEffect(() => {
    if (!asked.current || !drawn) return;
    asked.current = false;
    latest.current.land();
  }, [drawn]);
}
