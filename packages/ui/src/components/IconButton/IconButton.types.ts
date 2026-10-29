import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ActionReasonSentence } from '../ActionReason/ActionReason.types';

export type IconButtonVariant = 'surface' | 'dark' | 'ghost';

export interface IconButtonProps {
  children?: ReactNode;
  /** diameter in px; visual size (min touch target stays 44) */
  size?: number;
  /** required for a11y — icon-only buttons must carry a label */
  label: TranslatedText;
  variant?: IconButtonVariant;
  disabled?: boolean;
  /**
   * **Why it is off**, opened in the `Explainer` bubble above the circle on a tap, click, focus or
   * hover (`ReasonExplainer`); the control becomes `aria-disabled` and stays focusable, and nothing
   * is drawn under it. Only with `disabled`. Where the act is someone else's, the surface owes a
   * `ScopeNote` instead.
   */
  disabledReason?: ActionReasonSentence;
  /** Holds the reason bubble open (`true`) or shut (`false`); unset lets a tap open it. */
  reasonOpen?: boolean;
  onClick?: () => void;
}
