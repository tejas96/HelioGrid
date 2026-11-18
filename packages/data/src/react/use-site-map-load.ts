'use client';
import type { Read } from '@heliogrid/domain';
import { useCallback, useState } from 'react';

/** The map under the pin as Site details holds it: its size, and how its live load stands. */
export interface SiteMapHeld {
  readonly big: boolean;
  open(): void;
  close(): void;
  /** The platform draws its live map: not after a load that failed, nor where it has none to draw. */
  readonly live: boolean;
  /** What the map's frame shows: the map (or its neutral grid), or that it did not load, with the retry. */
  readonly read: Read<null>;
  /** Counts the loads asked for, so a retry is a fresh one. */
  readonly attempt: number;
  /** Counts the times the live map must be told the standing pin again, though the pin did not change. */
  readonly shown: number;
  /** The platform's live map did not load. */
  loadFailed(): void;
  /** The platform has no live map to draw: the frame keeps its neutral grid, and nothing failed. */
  noMap(): void;
  retry(): void;
}

interface Load {
  readonly state: 'live' | 'failed' | 'none';
  readonly attempt: number;
  readonly shown: number;
}

/**
 * The map's own state on Site details, the same for the web's map and the phone's: bigger or not,
 * loaded or not. `showAgain` is for a move the form refused — the map rests where the person left
 * it, so it is told the pin once more.
 */
export function useSiteMapLoad(): { readonly map: SiteMapHeld; showAgain(): void } {
  const [big, setBig] = useState(false);
  const [load, setLoad] = useState<Load>({ state: 'live', attempt: 0, shown: 0 });
  const retry = () => setLoad((held) => ({ ...held, state: 'live', attempt: held.attempt + 1 }));
  const showAgain = useCallback(() => setLoad((held) => ({ ...held, shown: held.shown + 1 })), []);
  return {
    map: {
      big,
      open: () => setBig(true),
      close: () => setBig(false),
      live: load.state === 'live',
      read:
        load.state === 'failed'
          ? { kind: 'failed', failure: 'no_answer', retry }
          : { kind: 'ready', value: null },
      attempt: load.attempt,
      shown: load.shown,
      loadFailed: () => setLoad((held) => ({ ...held, state: 'failed' })),
      noMap: () => setLoad((held) => ({ ...held, state: 'none' })),
      retry,
    },
    showAgain,
  };
}
