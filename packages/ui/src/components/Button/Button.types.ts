import type { ReactNode } from 'react';
import type { ActionReasonSpec } from '../ActionReason/ActionReason.types';

/** primary = near-black (default, the identity marker); never make it coloured. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  children?: ReactNode;
  /** primary = near-black (default, the identity marker); never make it coloured */
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /**
   * **Why it is off** — `MS4-15`'s *"when unavailable the control **STATES THE REASON**"*. Rendered
   * by `ActionReason` directly under the pill, so the button becomes a column (`style` still lands
   * on the pill). Renders only when `disabled` is also true: an available act has no reason.
   *
   * With a reason the button is `aria-disabled` and **stays focusable**, activation suppressed — a
   * native `disabled` leaves the tab order, and a description on an unreachable element is never
   * announced. Where the act is *absent* rather than off, render no button and let the surface carry
   * a `ScopeNote`.
   */
  disabledReason?: ReactNode | ActionReasonSpec;
  /** replaces the label with a spinner, keeps width fixed */
  loading?: boolean;
  /** leading icon node (Lucide, 20px, 1.5 stroke) */
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  onClick?: () => void;
}
