'use client';
import { useEffect, useRef } from 'react';

/** Hold − or + on a length and it repeats: first after this long, then this often. */
const REPEAT_AFTER_MS = 400;
const REPEAT_EVERY_MS = 80;

/** A timer that starts on a press and stops on its release; it never outlives the screen. */
function usePressTimer() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  // A timer still running when the screen leaves is cleared with it.
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  return { timer, stop };
}

/**
 * The studio's press timing (`T-M05-002`, part b): a held − or + steps again and again. The screen
 * says when a press starts and ends; the timing is here.
 */
export function useRepeatPress(): { start(step: () => void): void; stop(): void } {
  const { timer, stop } = usePressTimer();
  return {
    start: (step) => {
      stop();
      step();
      const again = () => {
        step();
        timer.current = setTimeout(again, REPEAT_EVERY_MS);
      };
      timer.current = setTimeout(again, REPEAT_AFTER_MS);
    },
    stop,
  };
}
