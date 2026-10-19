import { useSyncExternalStore } from 'react';

/**
 * Whether the window stands at the shell's desktop width — the theme's `--bp-desktop`, read from
 * the page so the number is written once, in the design system (the same width the stylesheets
 * break at). `null` until the browser answers, since the server cannot know: a part that branches
 * on it draws nothing rather than the wrong arrangement for a frame.
 */
export function useDesktopShell(): boolean | null {
  return useSyncExternalStore(subscribe, readDesktop, () => null);
}

/** One query per page: the token cannot change while the page lives. */
let query: MediaQueryList | null = null;

function desktopQuery(): MediaQueryList {
  if (query === null) {
    const width = getComputedStyle(document.documentElement).getPropertyValue('--bp-desktop');
    query = window.matchMedia(`(min-width: ${width.trim()})`);
  }
  return query;
}

function readDesktop(): boolean {
  return desktopQuery().matches;
}

function subscribe(onChange: () => void): () => void {
  const list = desktopQuery();
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}
