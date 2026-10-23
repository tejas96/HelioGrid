import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/**
 * Whether the person asked for reduced motion (`F7-51` floor 3): read once here for every
 * component, never by its own `matchMedia`. A one-shot CSS motion needs no read — its duration
 * tokens fall to 1ms on their own; a motion the web drives from script asks this.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
