/* This half is the WEB half and it reaches for real DOM globals (document, HTMLElement). Sibling
   components import overlay barrels rather than `.native` paths, which drags this file into the
   native tsconfig's program, so it declares the lib it needs instead of failing there. */
/// <reference lib="dom" />
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export interface OverlayDismissOptions {
  open: boolean;
  /** The dialog element: focused on open unless focus is already inside it; the trap's boundary. */
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
 * Esc, the focus trap, the page's scroll lock and focus restore — the four the whole Sheet family
 * shares, in one place so Sheet, Modal and DetailPanel cannot answer them three ways.
 *
 * MODAL AND NON-MODAL ARE THREE BEHAVIOURS MOVING TOGETHER, not one flag on a backdrop: a trap, a
 * scroll lock and a backdrop. Two of the three live here; the caller drops the third.
 */
/**
 * The overlays open now, oldest first. Each listens on the document, where listeners run in the
 * order they were added, so the one opened first would answer Esc first and close the sheet under
 * a dialog opened over it: only the top one answers.
 */
const openOverlays: symbol[] = [];

/** Puts a layer on top of the open overlays; the answer takes it off again. */
function enterLayer(me: symbol): () => void {
  openOverlays.push(me);
  return () => {
    const at = openOverlays.indexOf(me);
    if (at !== -1) openOverlays.splice(at, 1);
  };
}

/**
 * A popover over a sheet — a date picker, a menu, a select's list — is a layer too, while it is
 * open: the sheet under it then leaves Esc to it, and one Esc closes only the popover.
 */
export function useOverlayLayer(open: boolean): void {
  useEffect(() => {
    if (!open) return;
    return enterLayer(Symbol('popover'));
  }, [open]);
}

export function useOverlayDismiss({
  open,
  panelRef,
  dismissible,
  onClose,
  modal = true,
  inset,
}: OverlayDismissOptions): void {
  /* Read through refs: a host that passes a new `onClose` each render would otherwise re-run the
     effect on every render — taking focus back to the panel and forgetting where it came from, so
     closing could not return it. */
  const close = useRef(onClose);
  close.current = onClose;
  const canDismiss = useRef(dismissible);
  canDismiss.current = dismissible;
  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }
    const restore = document.activeElement;
    /* A field the content focuses as it mounts (`autoFocus`, which React applies before any
       effect) keeps the focus: moving it to the panel here would take the one task's field away. */
    const panel = panelRef.current;
    if (panel !== null && !panel.contains(restore)) panel.focus({ preventScroll: true });

    const me = Symbol('overlay');
    const leave = enterLayer(me);
    const onKey = (event: KeyboardEvent) => {
      if (openOverlays.at(-1) !== me) return;
      const onEscape = close.current;
      if (event.key === 'Escape' && canDismiss.current && onEscape !== undefined) {
        event.stopPropagation();
        onEscape();
      }
      if (modal && event.key === 'Tab') {
        trapTab(event, panelRef.current);
      }
    };
    document.addEventListener('keydown', onKey, true);

    /* The page's scroller is the root: `<body>` keeps its sideways clip, which the page's leaning
       grid overruns. A lock written on the body turned that clip into a scroller, and a focus or a
       scroll into view then slid the whole app sideways under the panel. */
    const lock = modal && !inset;
    const scroller = document.documentElement;
    const previous = lock ? scroller.style.overflow : '';
    if (lock) {
      scroller.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', onKey, true);
      leave();
      if (lock) {
        scroller.style.overflow = previous;
      }
      if (restore instanceof HTMLElement) {
        restore.focus({ preventScroll: true });
      }
    };
  }, [open, panelRef, modal, inset]);
}
