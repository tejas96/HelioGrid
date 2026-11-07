import { type ThemePalette, theme } from '@heliogrid/theme';
import { useSyncExternalStore } from 'react';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function isDark(): boolean {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'dark') return true;
  if (chosen === 'light') return false;
  return window.matchMedia(DARK_QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  const observer = new MutationObserver(onChange);
  media.addEventListener('change', onChange);
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
  return () => {
    media.removeEventListener('change', onChange);
    observer.disconnect();
  };
}

/** The palette of the scheme on screen, as hex — for a mix or a canvas, never a style. */
export function usePalette(): ThemePalette {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return dark ? theme.palettes.dark : theme.palettes.light;
}
