'use client';
import { type RefObject, useLayoutEffect, useSyncExternalStore } from 'react';

/** The page's own shape, the same one a stylesheet's `orientation` reads. */
const UPRIGHT = '(orientation: portrait)';

/** The last shape read while nothing was being typed. */
let held = true;

/**
 * Whether the page stands upright (the platform adapter). A phone held sideways lays its panels and
 * tools out as a desktop does. While a field takes typing the last shape is held: a browser that
 * shrinks the page for the keyboard would read an upright phone as sideways mid-typing. It marks
 * the studio's frame `data-upright` for the stylesheets, and returns it for the focus rules.
 */
export function useUpright(frame: RefObject<HTMLElement | null>): boolean {
  const upright = useSyncExternalStore(subscribe, read, () => true);
  useLayoutEffect(() => {
    if (frame.current !== null) frame.current.dataset.upright = String(upright);
  }, [frame, upright]);
  return upright;
}

function read(): boolean {
  const typing = document.activeElement?.matches('input, textarea, [contenteditable]') ?? false;
  if (!typing) held = window.matchMedia(UPRIGHT).matches;
  return held;
}

function subscribe(onChange: () => void): () => void {
  const shape = window.matchMedia(UPRIGHT);
  shape.addEventListener('change', onChange);
  // Typing ends: the shape is read again, once focus has left the field.
  const later = () => window.setTimeout(onChange, 0);
  document.addEventListener('focusout', later);
  return () => {
    shape.removeEventListener('change', onChange);
    document.removeEventListener('focusout', later);
  };
}
