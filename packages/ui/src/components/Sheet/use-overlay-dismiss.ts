/* This half is the WEB half and it reaches for real DOM globals (document, HTMLElement). Sibling
   components import overlay barrels rather than `.native` paths, which drags this file into the
   native tsconfig's program, so it declares the lib it needs instead of failing there. */
/// <reference lib="dom" />
import type { RefObject } from 'react';
import { useEffect } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export interface OverlayDismissOptions {
  open: boolean;
  /** The dialog element. It is focused on open and is the trap's boundary. */
  panelRef: RefObject<HTMLElement | null>;
  /** false = must resolve via an action; Esc and the backdrop stop closing. */
  dismissible: boolean;
  onClose?: () => void;
  /**
   * **Modal by default.** `false` drops the focus trap AND the scroll lock — the same decision as
   * the backdrop, which the caller drops alongside. Focus still MOVES in on open and is still
   * restored on close: the editor is still the thing you just opened; Tab simply reaches the page.
   */
  modal?: boolean;
  /** An inset overlay lives in a specimen card or a device frame, not in the document — no lock. */
  inset: boolean;
}

/** Wraps Tab at the panel's edges, so focus never leaves a modal overlay by keyboard. */
function trapTab(event: KeyboardEvent, panel: HTMLElement | null): void {
  if (panel === null) {
    return;
  }
  const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (first === undefined || last === undefined) {
    return;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Esc, the focus trap, the body scroll lock and focus restore — the four the whole Sheet family
 * shares, in one place so Sheet, Modal and DetailPanel cannot answer them three ways.
 *
 * MODAL AND NON-MODAL ARE THREE BEHAVIOURS MOVING TOGETHER, not one flag on a backdrop: a trap, a
 * scroll lock and a backdrop. Two of the three live here; the caller drops the third.
 */
export function useOverlayDismiss({
  open,
  panelRef,
  dismissible,
  onClose,
  modal = true,
  inset,
}: OverlayDismissOptions): void {
  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }
    const restore = document.activeElement;
    panelRef.current?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible && onClose !== undefined) {
        event.stopPropagation();
        onClose();
      }
      if (modal && event.key === 'Tab') {
        trapTab(event, panelRef.current);
      }
    };
    document.addEventListener('keydown', onKey, true);

    const lock = modal && !inset;
    const previous = lock ? document.body.style.overflow : '';
    if (lock) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (lock) {
        document.body.style.overflow = previous;
      }
      if (restore instanceof HTMLElement) {
        restore.focus({ preventScroll: true });
      }
    };
  }, [open, panelRef, dismissible, onClose, modal, inset]);
}
