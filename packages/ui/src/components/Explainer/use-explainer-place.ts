/// <reference lib="dom" />
import type { RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';
import {
  type ExplainerDensity,
  type ExplainerRect,
  explainerCap,
  isScrolledAway,
  type PlacedExplainer,
  placeExplainer,
} from './Explainer.logic';
import type { ExplainerBox, ExplainerPlacement } from './Explainer.types';

/** Placed relative to the trigger's wrapper, with the width cap the box allows. */
export interface PlacedBubble extends PlacedExplainer {
  cap: number;
}

interface PlaceInput {
  isOpen: boolean;
  /** The page on show: a page of another height is placed again. */
  content: unknown;
  wrap: RefObject<HTMLSpanElement | null>;
  bubble: RefObject<HTMLDivElement | null>;
  trigger: () => HTMLElement | null | undefined;
  within?: ExplainerBox;
  placement: ExplainerPlacement;
  density: ExplainerDensity;
  maxWidth?: number;
  onScrolledAway: () => void;
}

function resolveBox(within: ExplainerBox | undefined): HTMLElement | null {
  if (within === undefined) return null;
  if (typeof within === 'string') return document.querySelector<HTMLElement>(within);
  const node = 'current' in within ? (within as { current: unknown }).current : within;
  return node instanceof HTMLElement ? node : null;
}

function boundsOf(box: HTMLElement | null): ExplainerRect {
  return box === null
    ? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
    : box.getBoundingClientRect();
}

/**
 * Places, flips and clamps the bubble against the box it is in, and closes it once its trigger has
 * scrolled out of that box. `null` until the first measure, so the bubble is never seen misplaced.
 */
export function useExplainerPlace(input: PlaceInput): PlacedBubble | null {
  const [placed, setPlaced] = useState<PlacedBubble | null>(null);
  const { isOpen, content, within, placement, density, maxWidth } = input;

  // biome-ignore lint/correctness/useExhaustiveDependencies: the refs and callbacks are read at run time; listing them would re-run this on every render.
  useLayoutEffect(() => {
    if (!isOpen) {
      setPlaced(null);
      return;
    }
    const place = () => {
      const button = input.trigger();
      const shell = input.wrap.current;
      const card = input.bubble.current;
      if (!button || !shell || !card) return;
      const from = button.getBoundingClientRect();
      const bounds = boundsOf(resolveBox(within));
      if (isScrolledAway(from, bounds)) {
        input.onScrolledAway();
        return;
      }
      const cap = explainerCap(bounds, density, maxWidth);
      const size = { width: Math.min(card.offsetWidth, cap), height: card.offsetHeight };
      const spot = placeExplainer(from, bounds, size, placement, density);
      const origin = shell.getBoundingClientRect();
      setPlaced({ ...spot, left: spot.left - origin.left, top: spot.top - origin.top, cap });
    };
    place();
    /* A parent's ref attaches after this child's effect, and fonts or a panel may still be
       settling; timers, not rAF, because a hidden frame never gets an animation frame. */
    const soon = setTimeout(place, 0);
    const late = setTimeout(place, 150);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      clearTimeout(soon);
      clearTimeout(late);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [isOpen, content, placement, density, within, maxWidth]);

  return placed;
}
