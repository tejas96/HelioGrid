import { useEffect, useState } from 'react';

const QUERY = '(pointer: coarse)';

/**
 * Whether the main pointer is a finger. A media query, not a user-agent sniff, and it
 * re-evaluates when a mouse or a keyboard is attached. Web only — React Native is always coarse,
 * so a native half never asks. It answers `false` on the server: what it picks must not be in
 * server HTML, or a touch device hydrates another answer.
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
