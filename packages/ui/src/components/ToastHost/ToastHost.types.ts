import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { ToastTone } from '../Toast/Toast.types';

export interface ToastItem {
  id: number | string;
  tone?: ToastTone;
  title: TranslatedText;
  // biome-ignore lint/plugin/copy-prop-type: words, or the record a toast names (an item's brand and model)
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /**
   * The toast's own way back — *Undo*, drawn as a quiet small button, only on a host given
   * `onDismiss`: a press closes the toast first, so it runs once, then calls `onUndo`, which also
   * says where the keyboard goes next — the pressed button is gone. Takes the place of `action`.
   */
  undo?: { label: TranslatedText; onUndo: () => void; focusAfter: FocusAfter };
  /** Overrides the host duration for this one toast. */
  duration?: number;
}

export type ToastPosition = 'bottom-center' | 'bottom-right' | 'top-center';

/** A host that never closes a toast itself: no cross, no *Undo*, and no clock. */
interface ToastHostUndismissed {
  onDismiss?: undefined;
  dismissLabel?: undefined;
  focusAfter?: undefined;
}

/** A host that closes toasts: on its clock, by the cross, and by a toast's *Undo*. */
interface ToastHostDismissed {
  onDismiss: (id: number | string) => void;
  /** The cross's accessible name — it carries no words, so this is all a screen reader hears. */
  dismissLabel: TranslatedText;
  /**
   * Where focus lands once the cross has closed its toast (`F7-23` N5) — the page the toast spoke
   * about. A toast's *Undo* names its own.
   */
  focusAfter: FocusAfter;
}

interface ToastHostOwnProps {
  toasts: ToastItem[];
  position?: ToastPosition;
  /** Most toasts on screen at once. Older ones drop rather than piling up. */
  max?: number;
  duration?: number;
  /** Overrides the derived clearance. The default clears the nav's own height; on the phone the pill
   *  also stands on the device's home-bar inset, which this package reads nowhere — the app passes
   *  the shell's pill clearance there. */
  offset?: number;
}

/** Toast queue container: stacks, auto-dismisses, pauses while the pointer is over it. */
export type ToastHostProps = ToastHostOwnProps & (ToastHostUndismissed | ToastHostDismissed);

/** What `useToasts()` hands back — the queue state for ToastHost. */
export interface ToastQueue {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => number;
  dismiss: (id: number | string) => void;
}
