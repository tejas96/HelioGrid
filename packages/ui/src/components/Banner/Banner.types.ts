import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';

export type BannerKind =
  | 'state'
  | 'review-needed'
  | 'validation'
  | 'suggestion'
  | 'dunning'
  | 'data-integrity'
  | 'orphan-override'
  | 'below-cost'
  | 'preliminary'
  /** @deprecated Use `Disclosure`. A mandatory honesty line is document content in the reading flow, not a dismissible operator strip. */
  | 'disclaimer'
  | 'cap'
  | 'bundle'
  /** A plain information line — "View only — Rajesh or Operations edit." The "i" glyph on the info
   *  tone, never dismissible: a fact about what is on screen is not tapped away. */
  | 'info';

export type BannerTone = 'danger' | 'warning' | 'info' | 'success' | 'accent' | 'neutral';

/** The glyph names the kind table picks from. Each is the kind's non-colour channel (F7-12). */
export type BannerGlyph = 'alert' | 'info' | 'rupee' | 'review' | 'spark';

/** One row of the kind table: tone, precedence rank, ARIA role and glyph. */
export interface BannerKindMeta {
  tone: BannerTone;
  rank: number;
  role: string;
  icon: BannerGlyph;
}

/**
 * In-page statement of a fact about what's on screen: needs review, overdue, below cost,
 * preliminary. Never covers content, never blocks interaction, and disappears when the fact
 * stops being true rather than being dismissed into silence.
 *
 * **Not the home of a mandatory disclosure.** `kind="disclaimer"` is superseded by `Disclosure`:
 * `M06-04`'s verbatim line belongs *in the reading flow at the weight of the figures it qualifies*,
 * on the customer's own surface, where `MS9-11` bans operator alerts. It still renders and is never
 * dismissible, and it warns in the console.
 */
interface BannerOwnProps {
  /** Picks the tone, glyph, ARIA role and precedence rank. */
  kind?: BannerKind;
  /** Bold first line. Omit for a single-line banner. */
  title?: TranslatedText;
  /** Body copy. Omit for a title-only banner. */
  children?: ReactNode;
  /** Trailing action — use `BannerAction`. */
  action?: ReactNode;
  /**
   * Opt-in only. **Ignored for eight kinds** — `validation`, `data-integrity`, `below-cost`, the
   * billing/lifecycle three, `state`, `dunning` and `cap`, `info`, and the superseded `disclaimer`.
   * None of them stops being true because a user tapped the cross, and `SCR-SHELL-06`'s banner is
   * `BM-32`'s **guaranteed way back** — a dismissible way back is not one.
   */
  dismissible?: boolean;
  /** Override the kind's tone. Rarely right. */
  tone?: BannerTone;
  /** block = full-width strip (default) · pill = compact inline chip. */
  variant?: 'block' | 'pill';
  density?: 'expressive' | 'functional';
  icon?: ReactNode;
  /**
   * Below this much of the banner's **own** width (never the viewport), the action drops to its own
   * line under the body — its 44px target kept — so the copy keeps the whole width. Default 400: a
   * phone-width banner (343 inside 375) falls below it, a 600px strip does not. A pill ignores it.
   */
  actionBelow?: number;
  /** Fires when that own-width answer changes, so a surface arranging content around the banner
   *  reads this measurement instead of observing the same element a second time. */
  onFormChange?: (info: BannerForm) => void;
}

/** A banner with no way to dismiss it. */
interface BannerUndismissed {
  onDismiss?: undefined;
  dismissLabel?: undefined;
  focusAfter?: undefined;
}

/** A banner the person may dismiss, when its kind allows it and `dismissible` asks. */
interface BannerDismissed {
  onDismiss: () => void;
  /** The cross's accessible name — it carries no words, so this is all a screen reader hears. */
  dismissLabel: TranslatedText;
  /** Where focus lands once the banner has gone (`F7-23` N5). */
  focusAfter: FocusAfter;
}

export type BannerProps = BannerOwnProps & (BannerUndismissed | BannerDismissed);

/** Where the banner put its action, and the own width that decided it. */
export interface BannerForm {
  actionStacked: boolean;
  width: number;
}

/**
 * Inline pill action inside a banner. Never a filled primary button.
 *
 * **44px target, 32px pill.** A banner is a mobile surface and this is where "Pay now" lives, so
 * the button clears the touch floor while the visible pill stays 32 — the target and the pill are
 * two different rectangles, as in `FilterBar`. The 6px it borrows per side comes back as negative
 * margin, so adding the target does not make the banner taller.
 */
export interface BannerActionProps {
  children: ReactNode;
  onClick?: () => void;
  /**
   * Where focus lands once the action has ended the banner's fact and the banner has gone with it
   * (`F7-23` N5) — what replaced the banner, else its part's frame or heading.
   */
  focusAfter: FocusAfter;
}

/**
 * Orders banners by precedence and applies the surface's one-or-many rule.
 *
 * **Neither `mode` nor `max` may hide a mandatory banner.** They are arrangements for facts that
 * can speak for one another, and a never-dismissible kind cannot: a tenant's way back (`BM-32`) is
 * not less true because a below-cost warning outranks it. Every `NEVER_DISMISSIBLE` child renders,
 * and the cap applies to the rest.
 *
 * **And it is never the gate.** A set that must list *every* failure, counted, each with a jump to
 * the step that fixes it, is `FindingList` (law 20).
 */
export interface BannerStackProps {
  children?: ReactNode;
  /** stack = show all (up to `max`) · single = the broadest true fact speaks. */
  mode?: 'stack' | 'single';
  /** Caps the **dismissible** banners only. A never-dismissible kind is never capped away. */
  max?: number;
  gap?: number;
  /** The line under a stack that capped some banners away: "2 more notices on this screen". */
  moreLabel: (hidden: number) => TranslatedText;
}
