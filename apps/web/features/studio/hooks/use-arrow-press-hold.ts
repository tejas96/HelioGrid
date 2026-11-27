import { useEffect, useRef } from 'react';

/** A press that lands on one of these is the arrow's, never the camera's. */
const ARROW_SELECTOR = '[data-arrow="true"]';

/**
 * A press on a height arrow holds the camera at once, before its controls see it: on a touch
 * screen they take the finger before the page's state says the arrow is held. Let go, the page's
 * own hold decides again. The web's half: the document's pointer, read as it goes down.
 */
export function useArrowPressHold(
  map: HTMLCanvasElement,
  arrowHeld: boolean,
  holds: { readonly arrow: boolean },
  holdFor: (part: 'arrow', holding: boolean) => void,
) {
  const held = useRef(arrowHeld);
  held.current = arrowHeld;
  const hold = useRef(holdFor);
  hold.current = holdFor;
  useEffect(() => {
    const page = map.ownerDocument;
    const press = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(ARROW_SELECTOR) !== null)
        hold.current('arrow', true);
    };
    const release = () => {
      if (holds.arrow && !held.current) hold.current('arrow', false);
    };
    page.addEventListener('pointerdown', press, true);
    page.addEventListener('pointerup', release, true);
    page.addEventListener('pointercancel', release, true);
    return () => {
      page.removeEventListener('pointerdown', press, true);
      page.removeEventListener('pointerup', release, true);
      page.removeEventListener('pointercancel', release, true);
    };
  }, [map, holds]);
}
