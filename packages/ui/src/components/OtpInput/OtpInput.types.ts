/**
 * Verification-code field: mono digits in 48x56 boxes, auto-advance, paste fills the code.
 *
 * Field users log in on a roof with one hand, so the boxes are large and the paste path always
 * works — the code and the SMS are usually on the same phone.
 */
export interface OtpInputProps {
  /** Default 6. */
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  /** Fired once the full code is entered. */
  onComplete?: (value: string) => void;
  label?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  /**
   * Shows a code it will not take: not editable, on the normal ground, never greyed
   * (`SCR-M01-01`). `disabled` is for a field with nothing to take.
   */
  readOnly?: boolean;
  /** A request is running with this code: read-only for its length, and announced as busy. */
  busy?: boolean;
  autoFocus?: boolean;
}
