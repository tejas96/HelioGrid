import type { ReactNode } from 'react';

/** The five toast tones. Each resolves to a semantic `-text` on `-bg` pair for the leading mark. */
export type ToastTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * White toast card (16px radius, e5) with a leading semantic icon in a circular tint.
 * One at a time — the queue, the stacking and the auto-dismiss belong to `ToastHost`.
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
