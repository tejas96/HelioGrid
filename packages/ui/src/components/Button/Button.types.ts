import type { ReactNode } from 'react';
import type { ActionReasonSpec } from '../ActionReason/ActionReason.types';

/** primary = near-black (default, the identity marker); never make it coloured. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  /**
   * The words on the button — required: a Button with only an `icon` would be an icon-only control
   * with no accessible name, which `F7-26` makes a build failure. An icon-only control is an
   * `IconButton`, whose `label` is required.
   */
  children: string;
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
  /**
   * Replaces the label with a spinner for the eye; a screen reader still hears the words, and the
   * button is busy. Web: a `spokenOnly` copy of the words and `aria-busy`. Native:
   * `accessibilityLabel` and `accessibilityState.busy`.
   */
  loading?: boolean;
  /** leading icon node — a glyph this package draws, 20px, 1.5 stroke */
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  /**
   * Set only on a button that shows and hides something below it: whether that is shown now. A
   * screen reader says "expanded" or "collapsed" with the words, so the state is never sight-only.
   */
  expanded?: boolean;
  /**
   * What a screen reader says in place of the words, when the words alone hide a rule the person
   * must hear ("Continue with Google. Signs you in to the same account as your mobile number.").
   * It starts with the visible words, so speech control can still find the button by what it shows.
   * Web: `aria-label`. Native: `accessibilityLabel`.
   */
  spokenName?: string;
  onClick?: () => void;
}
