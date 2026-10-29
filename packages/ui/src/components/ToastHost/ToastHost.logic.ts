import type { ToastItem } from './ToastHost.types';

/** The newest `max` toasts: older ones drop rather than piling up over a phone screen. */
export function shownToasts(toasts: readonly ToastItem[], max: number): ToastItem[] {
  return toasts.slice(-max);
}
