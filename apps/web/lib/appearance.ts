'use client';
import { type Appearance, appearanceOf } from '@heliogrid/domain';
import { useSyncExternalStore } from 'react';

/**
 * The appearance kept on this browser. `device` leaves `<html>` without `data-theme`, so the
 * stylesheet follows the system; `light` or `dark` sets it. `APPEARANCE_BOOT` applies the stored
 * choice before the first paint, so the page never flashes the wrong scheme.
 */
const KEY = 'hg.appearance';
const CHANGED = 'hg-appearance';

export const APPEARANCE_BOOT = `try{var a=localStorage.getItem('${KEY}');if(a==='light'||a==='dark')document.documentElement.dataset.theme=a}catch(e){}`;

function stored(): Appearance {
  try {
    return appearanceOf(window.localStorage.getItem(KEY)) ?? 'device';
  } catch {
    return 'device';
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function choose(next: Appearance): void {
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    // A browser that refuses storage still switches for this visit.
  }
  if (next === 'device') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = next;
  window.dispatchEvent(new Event(CHANGED));
}

export function useAppearance(): readonly [Appearance, (next: Appearance) => void] {
  const appearance = useSyncExternalStore(subscribe, stored, () => 'device' as const);
  return [appearance, choose];
}
