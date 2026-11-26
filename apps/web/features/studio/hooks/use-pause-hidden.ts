import { useEffect } from 'react';

/**
 * Stops a play when the page goes to the background (`.claude/rules/ui-adherence.md`, *Motion*:
 * a loop stops when the tab is hidden): the web's half, from the page's visibility.
 */
export function usePauseWhenHidden(playing: boolean, pause: () => void) {
  useEffect(() => {
    if (!playing) return;
    const hidden = () => {
      if (document.visibilityState === 'hidden') pause();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, [playing, pause]);
}
