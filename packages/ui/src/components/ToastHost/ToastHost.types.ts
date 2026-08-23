import type { ReactNode } from 'react';
import type { ToastTone } from '../Toast/Toast.types';

export interface ToastItem {
  id: number | string;
  tone?: ToastTone;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Overrides the host duration for this one toast. */
  duration?: number;
}

export type ToastPosition = 'bottom-center' | 'bottom-right' | 'top-center';

/** Toast queue container: stacks, auto-dismisses, pauses while the pointer is over it. */
export interface ToastHostProps {
  toasts: ToastItem[];
  onDismiss?: (id: number | string) => void;
  position?: ToastPosition;
  /** Most toasts on screen at once. Older ones drop rather than piling up. */
  max?: number;
  duration?: number;
  /** Distance from the bottom — clear the bottom nav on a phone. */
  offset?: number;
}

/** What `useToasts()` hands back — the queue state for ToastHost. */
export interface ToastQueue {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => number;
  dismiss: (id: number | string) => void;
}
