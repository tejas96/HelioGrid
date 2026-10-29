import type { RefObject } from 'react';
import { useEffect } from 'react';

const FOCUSABLE =
  'a[href],button,input,select,textarea,summary,iframe,[contenteditable],[tabindex]:not([tabindex="-1"])';

/**
 * NOT `inert` — see PreviewFrame.tsx. `inert` removes the subtree from the ACCESSIBILITY TREE,
 * and on `SCR-M01-18` the preview is what the person is judging. Unoperable but readable:
 * `pointer-events: none` above, `tabindex="-1"` here, re-applied as the subject redraws — a
 * subject changes as the settings change, so the observer keeps the two in step.
 *
 * Deliberately runs on EVERY render, exactly as the design system's implementation does: the
 * subtree is re-walked whenever the subject could have changed.
 */
export function useDetunedSubject(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }
    const detune = () => {
      for (const node of Array.from(element.querySelectorAll(FOCUSABLE))) {
        if (node.getAttribute('tabindex') !== '-1') {
          node.setAttribute('tabindex', '-1');
        }
      }
    };
    detune();
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    const observer = new MutationObserver(detune);
    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'href', 'disabled'],
    });
    return () => observer.disconnect();
  });
}
