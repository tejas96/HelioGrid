import type { ReactNode, Ref } from 'react';
import type { ActionReasonSpec } from '../ActionReason/ActionReason.types';
import type { FocusHandle } from '../SearchField/SearchField.types';

/** primary = near-black (default, the identity marker); never make it coloured. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export type ButtonSize = 'lg' | 'md' | 'sm';

export type ButtonTone = 'danger';

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
   * **Why it is off** — `MS4-15`'s *"when unavailable the control **STATES THE REASON**"*. It opens
   * in the `Explainer` bubble above the pill (`ReasonExplainer`): a tap or click opens it, a second
   * one closes it, and keyboard focus or a hover (where the pointer can hover) opens it too; nothing
   * is drawn under the pill. The sentence stays the button's description for a screen reader.
   * Renders only when `disabled` is also true: an available act has no reason.
   *
   * With a reason the button is `aria-disabled` and **stays focusable**, activation suppressed — a
   * native `disabled` leaves the tab order, and a description on an unreachable element is never
   * announced. Where the act is *absent* rather than off, render no button and let the surface carry
   * a `ScopeNote`.
   */
  disabledReason?: ReactNode | ActionReasonSpec;
  /** Holds the reason bubble open (`true`) or shut (`false`); unset lets a tap open it. */
  reasonOpen?: boolean;
  /**
   * Replaces the label with a spinner for the eye; a screen reader still hears the words, and the
   * button is busy. Web: a `spokenOnly` copy of the words and `aria-busy`. Native:
   * `accessibilityLabel` and `accessibilityState.busy`. A press while loading sends nothing: the
   * first press is still out.
   */
  loading?: boolean;
  /**
   * Leading icon node — a glyph this package draws: 20px at stroke 1.5, and a row act's glyph 16px
   * at stroke 1.8 (`ShellGlyph` size `sm`).
   */
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  /**
   * `danger` on a `secondary` or `ghost` pill: the danger words and glyph on the white pill, for a
   * row's act that ends something (Deactivate). Not read on `primary` or `destructive`; the confirm
   * itself stays `destructive`.
   */
  tone?: ButtonTone;
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
  /** A focus handle: web focuses the `<button>`, native moves the screen reader's focus to it. */
  ref?: Ref<FocusHandle>;
  onClick?: () => void;
}
