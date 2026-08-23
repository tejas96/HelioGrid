import type { ReactNode } from 'react';
import type { ActionReasonSpec } from '../ActionReason/ActionReason.types';

export type IconButtonVariant = 'surface' | 'dark' | 'ghost';

export interface IconButtonProps {
  children?: ReactNode;
  /** diameter in px; visual size (min touch target stays 44) */
  size?: number;
  /** required for a11y — icon-only buttons must carry a label */
  label: string;
  variant?: IconButtonVariant;
  disabled?: boolean;
  /**
   * **Why it is off**, rendered by `ActionReason` under the circle; the control becomes
   * `aria-disabled` and stays focusable. Only with `disabled`.
   *
   * If a sentence will not fit the toolbar this button sits in, do **not** disable it silently:
   * either the act belongs at full size somewhere the reason can be read, or it is someone else's act
   * and the surface owes a `ScopeNote`.
   */
  disabledReason?: ReactNode | ActionReasonSpec;
  onClick?: () => void;
}
