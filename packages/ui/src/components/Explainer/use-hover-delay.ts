import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';

/**
 * A hover opens its bubble only after the tip delay, so a pointer passing over an "i" never flashes
 * one (OneOhm's tooltip). Leaving first cancels it; the latest `open` is the one that runs, so a
 * bubble a tap opened meanwhile is not taken over by the hover.
 */
export function useHoverDelay(open: () => void): { enter: () => void; leave: () => void } {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(open);
  latest.current = open;
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    enter: () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current(), theme.motion.tipDelayMs);
    },
    leave: () => clearTimeout(timer.current),
  };
}
