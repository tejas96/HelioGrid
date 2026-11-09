import { theme } from '@heliogrid/theme';
import { createContext } from 'react';

/**
 * How far the page under the phone's top bar has scrolled, told as it moves. The frame that
 * scrolls makes one and provides it (`BarScrollContext`); the bar listens and fades its frosted
 * band and its small title in by the distance, never by a flag — a flag flips the band from clear
 * to solid in one frame, which read as the header turning white all at once.
 */
export interface BarScroll {
  subscribe(listener: (offset: number) => void): () => void;
  tell(offset: number): void;
  /** The last offset told, so a bar mounted mid-scroll starts where the page is. */
  current(): number;
}

export function createBarScroll(): BarScroll {
  const listeners = new Set<(offset: number) => void>();
  let last = 0;
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    tell(offset) {
      last = offset;
      for (const listener of listeners) listener(offset);
    },
    current: () => last,
  };
}

/** The scroll a bar under this provider listens to; none leaves the bar on its `scrolled` flag. */
export const BarScrollContext = createContext<BarScroll | null>(null);

/** The distance over which the frosted band comes in: the bar's own height. */
export const FROST_DISTANCE = theme.layout['topbar-h-mobile'];

/**
 * Where the bar's small title comes in: over the last half of the large title's line, so it is
 * whole by the time the large title has gone under the bar.
 */
export const TITLE_FADE: readonly [number, number] = [
  theme.type.roles.display.lineHeight / 2,
  theme.type.roles.display.lineHeight,
];

/** The band's share of its full strength at `offset`, 0 at rest to 1 past `FROST_DISTANCE`. */
export function frostAt(offset: number): number {
  return Math.min(1, Math.max(0, offset / FROST_DISTANCE));
}

/** The small title's share of its full strength at `offset`. */
export function titleAt(offset: number): number {
  const [from, to] = TITLE_FADE;
  return Math.min(1, Math.max(0, (offset - from) / (to - from)));
}
