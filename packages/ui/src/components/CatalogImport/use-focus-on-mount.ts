import { useEffect, useRef } from 'react';

/**
 * Focus on a card the moment it appears, when `focus` asks: a fix removes the card that was
 * pressed, so its settled card — or, after *Undo*, the card that returns — takes the focus the
 * press had, and a keyboard or screen-reader user is not sent back to the page's start.
 */
export function useFocusOnMount<Target extends HTMLElement>(focus: boolean) {
  const target = useRef<Target>(null);
  useEffect(() => {
    if (focus) target.current?.focus();
  }, [focus]);
  return target;
}
