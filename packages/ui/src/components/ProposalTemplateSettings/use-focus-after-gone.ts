import { type RefObject, useEffect, useRef } from 'react';

/**
 * *Save template* and *Discard changes* take their own bar away, which would leave the keyboard
 * and the screen reader at the page's start. When the bar goes and the focus went with it, the
 * focus moves to the part's switch, where the person goes next. (Branding's own hook also follows
 * its logo; this page has none.)
 */
export function useFocusAfterGone(page: RefObject<HTMLElement | null>, held: boolean): void {
  const heldBefore = useRef(held);
  useEffect(() => {
    const gone = heldBefore.current && !held;
    heldBefore.current = held;
    const focusLost = document.activeElement === null || document.activeElement === document.body;
    if (!gone || !focusLost) return;
    page.current
      ?.querySelector<HTMLElement>('.hg-template-part-switch [aria-checked="true"]')
      ?.focus();
  });
}
