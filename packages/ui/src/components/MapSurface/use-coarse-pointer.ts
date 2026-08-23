import { useEffect, useState } from 'react';

const QUERY = '(pointer: coarse)';

/**
 * Coarse pointer = the touch additions. A media query, not a user-agent sniff, and it
 * re-evaluates: a tablet with a keyboard attached is both, which is what `input="both"` is for.
 * Web only — React Native is always coarse, so the native half passes `true`.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mq = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setCoarse(event.matches);
    mq.addEventListener('change', onChange);
    setCoarse(mq.matches);
    return () => {
      mq.removeEventListener('change', onChange);
    };
  }, []);

  return coarse;
}
