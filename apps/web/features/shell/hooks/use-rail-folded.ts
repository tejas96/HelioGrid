'use client';
import { useSyncExternalStore } from 'react';

/** Whether the person folded the sidebar to its icons, kept on this browser like the appearance. */
const KEY = 'hg.rail-folded';
const CHANGED = 'hg-rail-folded';
/** This visit's choice, for a browser that refuses storage. */
let held = false;

function stored(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'true';
  } catch {
    return held;
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

function setFolded(folded: boolean): void {
  held = folded;
  try {
    window.localStorage.setItem(KEY, String(folded));
  } catch {
    // A browser that refuses storage still folds for this visit.
  }
  window.dispatchEvent(new Event(CHANGED));
}

export function useRailFolded(): readonly [boolean, () => void] {
  const folded = useSyncExternalStore(subscribe, stored, () => false);
  return [folded, () => setFolded(!folded)];
}
