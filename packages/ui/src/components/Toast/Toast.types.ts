import type { ReactNode } from 'react';

/** The five toast tones. Each resolves to a semantic `-text` on `-bg` pair for the leading mark. */
export type ToastTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * White toast card (16px radius, e5) with a leading semantic icon in a circular tint.
 *
 * **A Toast is never placed by a caller.** `ToastHost` owns the queue, the stacking, the
 * auto-dismiss AND the position — including the clearance over the bottom nav, which it derives
 * from the nav's own height. A hand-positioned Toast is a second answer to that measurement.
 */
export interface ToastProps {
  tone?: ToastTone;
  title: string;
  description?: string;
  /** override the default semantic icon */
  icon?: ReactNode;
  /** trailing action node */
  action?: ReactNode;
}
