import { type RefObject, useEffect, useRef } from 'react';

/** What a press can make go: the act bar (saved or discarded), the save's banner, the logo (removed). */
interface Goers {
  readonly act: boolean;
  readonly failure: boolean;
  readonly logo: boolean;
}

/**
 * A control that takes itself away — *Save branding*, *Discard changes*, *Retry*, *Remove logo* —
 * would leave the keyboard and the screen reader at the page's start. When one goes and the focus
 * went with it, the focus moves to where the person goes next: the logo's drop surface after a
 * removal, else the part's switch.
 */
export function useFocusAfterGone(page: RefObject<HTMLElement | null>, now: Goers): void {
  const was = useRef(now);
  useEffect(() => {
    const before = was.current;
    was.current = now;
    const lostFocus = document.activeElement === null || document.activeElement === document.body;
    if (!lostFocus) return;
    const root = page.current;
    if (root === null) return;
    const logoGone = before.logo && !now.logo;
    const anyGone = logoGone || (before.act && !now.act) || (before.failure && !now.failure);
    if (!anyGone) return;
    const target = logoGone
      ? root.querySelector<HTMLElement>('.hg-branding-logo button, .hg-branding-logo input')
      : root.querySelector<HTMLElement>('.hg-branding-part-switch [aria-checked="true"]');
    target?.focus();
  });
}
