import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode, Ref } from 'react';
import type { FocusAfter, FocusHandle } from '../../primitives/FocusAfter';
import type { ActionReasonSentence } from '../ActionReason/ActionReason.types';

/** A label's figures, and the whole line as a screen reader hears it. */
export interface ButtonFigures {
  readonly values: readonly string[];
  readonly spoken: TranslatedText;
}

/** primary = near-black (default, the identity marker); never make it coloured. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

/**
 * `prominent` is a screen's one main verb (Home's *Add lead*): the largest pill, its glow deepest,
 * read before anything else on the page. At most one per screen, and only on `primary`.
 */
export type ButtonSize = 'prominent' | 'lg' | 'md' | 'sm';

/**
 * `danger`: the danger words, for a row's act that ends something. `inverse`: the words of an ink
 * surface, for a ghost act inside one — a toast's *Undo*.
 */
export type ButtonTone = 'danger' | 'inverse';

export interface ButtonProps {
  /**
   * The words on the button — required: a Button with only an `icon` would be an icon-only control
   * with no accessible name, which `F7-26` makes a build failure. An icon-only control is an
   * `IconButton`, whose `label` is required.
   */
  children: TranslatedText;
  /**
   * The figures the words hold as `FIGURE_SLOT`s — an amount in *Pay ₹3,999.00 now* — each drawn
   * in mono where the translation placed it (`F7-09`). The drawn runs are hidden from a screen
   * reader, so the line it hears, figures in place, comes with them.
   */
  figures?: ButtonFigures;
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
  disabledReason?: ActionReasonSentence;
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
   * row's act that ends something (Deactivate). `inverse` on a `ghost` pill inside an ink surface
   * (a toast): the surface's own words, which the page's would fail on in the dark. Not read on
   * `primary` or `destructive`; the confirm itself stays `destructive`.
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
  spokenName?: TranslatedText;
  /** A focus handle: web focuses the `<button>`, native moves the screen reader's focus to it. */
  ref?: Ref<FocusHandle>;
  onClick?: () => void;
}

/**
 * The one *Try again* every component's failed state draws. It renders only with both the act and
 * the words; it leaves with the failed state it sits in, so it names where focus lands then — the
 * part that reloads, which stays (`F7-23` N5).
 */
export interface RetryButtonProps {
  onRetry?: () => void;
  label?: TranslatedText;
  focusAfter: FocusAfter;
  /** Default `md`; a whole panel's failure draws it at `lg`, a quiet card's at `sm`. */
  size?: ButtonSize;
}
