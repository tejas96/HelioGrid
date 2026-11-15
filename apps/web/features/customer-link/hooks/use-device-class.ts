'use client';
import type { LinkDeviceClass } from '@heliogrid/data/react';
import { useSyncExternalStore } from 'react';

/**
 * A hand-held device has a coarse pointer; below the desktop's room it is a phone, at it a tablet.
 * Each query is asked where it is written, so the one breakpoint the product has is spelled once
 * per ask and nowhere else.
 */
const coarse = () => window.matchMedia('(pointer: coarse)');
const narrow = () => window.matchMedia('(max-width: 968px)');

function subscribe(changed: () => void): () => void {
  const queries = [coarse(), narrow()];
  for (const query of queries) query.addEventListener('change', changed);
  return () => {
    for (const query of queries) query.removeEventListener('change', changed);
  };
}

function deviceClass(): LinkDeviceClass {
  if (narrow().matches) return 'phone';
  return coarse().matches ? 'tablet' : 'desktop';
}

/**
 * The kind of device the page drew on (`F5-29`: an open records a device class and nothing else).
 * `null` on the server and until the page has drawn in a browser — which is what keeps a link
 * preview, which never draws, from ever counting as an open (`T-F5-007`).
 */
export function useDeviceClass(): LinkDeviceClass | null {
  return useSyncExternalStore(subscribe, deviceClass, () => null);
}
