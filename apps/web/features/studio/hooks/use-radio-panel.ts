'use client';
import { type RefObject, useEffect, useRef } from 'react';
import { usePressAway } from './use-press-away';

/**
 * A panel of choices opened from a button (the picture panel, the View panel) — the web's platform
 * adapter: it opens on the choice in force, as a radio group does, the arrows walk its choices, Esc
 * or a press outside closes it, and the button takes the focus back. The Esc is the
 * panel's: the studio's own Esc leaves the job in hand alone.
 */
export function useRadioPanel(
  panel: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  /** The button that opened it, which takes the focus back and closes the panel itself. */
  opener: RefObject<HTMLElement | null>,
  /** A selector of the opener, so a press on it is not a press outside. */
  keep: string,
): void {
  usePressAway(panel, open, onClose, keep);
  // Closed by Esc, its × or a choice, the panel took the focus with it: the opener takes it back once
  // it is on the screen again (on a phone the tools come back as the panel goes). A press outside
  // that put the focus somewhere keeps it there.
  const was = useRef(open);
  useEffect(() => {
    const closed = was.current && !open;
    was.current = open;
    if (!closed) return;
    const frame = requestAnimationFrame(() => {
      if (document.activeElement !== document.body && document.activeElement !== null) return;
      const at = opener.current;
      (at?.matches('button, [role="button"]') ? at : at?.querySelector('button'))?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, opener]);
  // The newest close, read when a key comes: a studio that draws again keeps the panel as it is.
  const latestClose = useRef(onClose);
  latestClose.current = onClose;
  useEffect(() => {
    if (!open) return;
    const radios = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          '[role="radio"]:not(:disabled):not([aria-disabled="true"])',
        ) ?? [],
      );
    // Opened, it lands once on the choice in force; the arrows then walk from there.
    const checked = panel.current?.querySelector<HTMLElement>(
      '[role="radio"][aria-checked="true"]',
    );
    (checked ?? radios()[0])?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        latestClose.current();
        return;
      }
      const by = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (by === undefined) return;
      const all = radios();
      const at = all.indexOf(document.activeElement as HTMLElement);
      if (at === -1) return;
      event.preventDefault();
      all[(at + by + all.length) % all.length]?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, panel]);
}
