import type { ReactNode } from 'react';

/**
 * The one label + hint + error + required wrapper every form control shares (docs/17 §4).
 * A control never draws its own label row; it is composed inside a Field.
 */
export interface FieldProps {
  /** The form control the field wraps. */
  children: ReactNode;
  /** Required copy — a control without a visible name is a defect, not a default. */
  label: string;
  /** Guidance under the control. Hidden while an error is showing. */
  hint?: string;
  /**
   * The validation MESSAGE — words rendered as text under the control. Colour is only
   * ever the second channel; a tint with no sentence is the defect this prop prevents.
   */
  error?: string;
  /** Marks the label; the control itself still carries its own required semantics. */
  required?: boolean;
}
