import type { ExplainerPaging } from '@heliogrid/domain';
import type { ReactElement, ReactNode } from 'react';

/**
 * One page: a sentence, or one node holding one to three short sentences. Never an array — an
 * array is PAGES, and a bare `ReactNode` would let four of them in as "one page" (`F7-46`).
 */
export type ExplainerPage = string | ReactElement;

export type ExplainerPlacement = 'top' | 'bottom' | 'left' | 'right';

/** Why the ask opened or closed. On the phone a scroll that starts outside reads as `outside`. */
export type ExplainerOpenReason =
  | 'trigger'
  | 'focus'
  | 'hover'
  | 'hover-out'
  | 'escape'
  | 'outside'
  | 'scroll';

/**
 * The box the bubble is capped, flipped and clamped inside — a phone shell, a `DetailPanel`, the
 * studio canvas. Platform-neutral like `CoachMarkAnchor`: the web half takes a ref, an element, a
 * selector or a function returning the element, the native half a ref to a view or a function
 * returning one; each narrows it at runtime. A function is read each time the bubble is placed, so
 * it may find a box that did not exist when the ask rendered.
 */
export type ExplainerBox = string | object | (() => object | null);

/**
 * What a host's own control is handed when it stands in for the "i" (`trigger`). It spreads them on
 * the element a press lands on, and the ask behaves exactly as with its own trigger: a press opens, a
 * second press closes, a press on a bubble that hover or focus opened takes it over; Escape, an
 * outside tap and scrolling away close it, and focus returns to the control.
 */
export interface ExplainerTriggerProps {
  /** The control's press. */
  onPress: () => void;
  /** Whether the bubble is open — `aria-expanded` on web, `accessibilityState.expanded` on native. */
  expanded: boolean;
  /**
   * Hands the control's own element to the ask, which returns focus to it on closing. The web also
   * places the bubble against it and tells its keyboard focus from the bubble's; native places the
   * bubble against the view that wraps the control.
   */
  ref?: (node: object | null) => void;
}

/** A button. Never a second action. */
export interface ExplainerButtonAction {
  label: string;
  onPress: () => void;
  href?: undefined;
}

/** A link: it goes somewhere, so it renders as a link, not a pill. */
export interface ExplainerLinkAction {
  label: string;
  href: string;
  onPress?: undefined;
}

/** `onPress` OR `href`, never both — the type refuses the pair. */
export type ExplainerAction = ExplainerButtonAction | ExplainerLinkAction;

export interface ExplainerBaseProps {
  /** The trigger's accessible name — "About shading loss". The caller's words; there is no fallback. */
  label: string;
  /** One short line. */
  title?: string;
  /** Preferred side. Flips to the opposite side when that side has no room. Default `bottom`. */
  placement?: ExplainerPlacement;
  /** ONE action, on the last page of a paged ask. Never two. */
  action?: ExplainerAction;
  density?: 'expressive' | 'functional';
  within?: ExplainerBox;
  /**
   * `auto` (default) opens on hover wherever the pointer can hover — a capability, never a width
   * (`F7-29a`) — and hover is never the only way in (`N1`). A touch screen has no hover, so the
   * native half never reads it.
   */
  hover?: 'auto' | boolean;
  /** Overrides the width cap; still clamped to the box minus its edge. */
  maxWidth?: number;
  /** Takes the extra hit box back as negative margin, so the 44px target fits a dense row. */
  inset?: boolean;
  /** A glyph this package draws, in place of the default "i". */
  glyph?: ReactNode;
  /**
   * A host's own control in place of the "i": called with the trigger's props, it returns the
   * control. `label` then names only the bubble, and `glyph` and `inset` are not read. The one ruled
   * use is a disabled act's reason (`ReasonExplainer`).
   */
  trigger?: (props: ExplainerTriggerProps) => ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, meta: { reason: ExplainerOpenReason }) => void;
}

/**
 * A labelled information control that opens a small anchored bubble by TAP — the same object on
 * both platforms, never a sheet on one and a bubble on the other. It carries TEACHING only: how a
 * feature works, why a rule exists, what the product can read.
 *
 * What it may never hold (`F8-07`, `F7-35`, `MS10-19`): a tier, a source, a staleness state, a
 * caveat, a number's derivation, money, what paused, an error's fix, a consequence read before
 * acting. There is no prop for any of them, and a page holding `Provenance`, `Derivation`,
 * `Disclosure`, `MoneySummary` or their siblings is warned by name with its real home.
 *
 * Paging (`pages`, and the pager words a paged ask cannot be written without) is
 * `@heliogrid/domain`'s `ExplainerPaging`, so both halves page by the one model.
 */
export type ExplainerProps = ExplainerBaseProps & ExplainerPaging<ExplainerPage>;
