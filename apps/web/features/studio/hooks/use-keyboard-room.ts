'use client';
import { type RefObject, useEffect } from 'react';

/** Less than this between the window and what is seen is the browser's own bars, not a keyboard. */
const KEYBOARD_MIN_PX = 120;

/**
 * The phone's keyboard (the platform adapter): while it is up, the studio's frame fits the part of
 * the screen above it — `--hg-seen-top` and `--hg-seen-height` with `data-keyboard` on the frame —
 * so a sheet at the foot sits on the keyboard and the camera frames the roof above the sheet. The
 * browser's own move of the page is undone, so the studio never slides out of sight.
 */
export function useKeyboardRoom(frame: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const seen = window.visualViewport;
    const node = frame.current;
    if (seen === null || node === null) return;
    const follow = () => {
      // The layout's height, not the window's: on an iPhone the window's shrinks with the keyboard.
      // Only while a field takes typing: a pinch that zooms the page shrinks what is seen too.
      const typing = document.activeElement?.matches('input, textarea, [contenteditable]') ?? false;
      const up = typing && document.documentElement.clientHeight - seen.height > KEYBOARD_MIN_PX;
      node.dataset.keyboard = String(up);
      node.style.setProperty('--hg-seen-top', `${seen.offsetTop}px`);
      node.style.setProperty('--hg-seen-height', `${seen.height}px`);
    };
    seen.addEventListener('resize', follow);
    seen.addEventListener('scroll', follow);
    document.addEventListener('focusin', follow);
    document.addEventListener('focusout', follow);
    follow();
    return () => {
      seen.removeEventListener('resize', follow);
      seen.removeEventListener('scroll', follow);
      document.removeEventListener('focusin', follow);
      document.removeEventListener('focusout', follow);
      delete node.dataset.keyboard;
    };
  }, [frame]);
}
