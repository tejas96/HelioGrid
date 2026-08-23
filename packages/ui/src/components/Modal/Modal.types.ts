import type { ReactNode } from 'react';

/** sm 400 · md 520 · lg 720 (capped at 100%). */
export type ModalSize = 'sm' | 'md' | 'lg';

export type ModalDensity = 'expressive' | 'functional';

/** Draws the leading circular icon tint. neutral = no icon unless `icon` is given. */
export type ModalTone = 'neutral' | 'danger' | 'warning' | 'success';

export interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  /** One or two sentences. For errors, state the problem and the fix. */
  description?: string;
  overline?: string;
  children?: ReactNode;
  /** sm 400 · md 520 · lg 720 (capped at 100%). */
  size?: ModalSize;
  density?: ModalDensity;
  /** Draws the leading circular icon tint. neutral = no icon unless `icon` is given. */
  tone?: ModalTone;
  icon?: ReactNode;
  footer?: ReactNode;
  showClose?: boolean;
  /** false for decisions that must be answered by an action. */
  dismissible?: boolean;
  inset?: boolean;
  zIndex?: number;
}
