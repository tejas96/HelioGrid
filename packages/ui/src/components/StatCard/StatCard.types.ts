import type { ReactNode } from 'react';
import type { BandSpec } from '../BandedFigure';
import type { NamedGapSpec } from '../NamedGap';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { SurfaceState } from '../UnavailableNote';

/** **Which way the figure moved, and nothing more.** `flat` draws a bar: zero has no direction. */
export type StatCardDeltaDir = 'up' | 'down' | 'flat';

/** **Whether that movement is good news** — a separate fact, because the component cannot infer it. */
export type StatCardSentiment = 'good' | 'bad' | 'neutral';

export interface StatCardProps {
  /** uppercase overline micro-label */
  label: string;
  /**
   * The number. Pass a **number** and the market pack formats it (`F1` / `F3-20`); pass a string
   * only when the caller genuinely owns the text.
   *
   * **Required.** An absent figure has two sanctioned routes and neither is an omitted `value`:
   * `gap` names what is missing in the value's own footprint, and a non-ready `state` says the
   * whole card has nothing to print. Omitting it renders an empty headline, which is neither.
   */
  value: string | number;
  unit?: string;
  /** Format the value as currency in the active market's currency and grouping. */
  money?: boolean;
  /** Use the pack's compact form — "4.52 lakh" under the IN pack (`M06-07`). */
  compact?: boolean;
  /**
   * **The figure is absent, and this names what is missing** — `M02-03`'s named gaps. Rendered by
   * `NamedGap` in the value's own footprint on an otherwise **ready** card, which is a different
   * statement from `state="empty"`. A gap **suppresses the delta and the provenance slot**: a delta
   * of an absent value is arithmetic on nothing, and a tier answers *how a figure was arrived at*,
   * which has no answer when there is no figure.
   */
  gap?: ReactNode | NamedGapSpec;
  /** delta chip text, e.g. "12%" */
  delta?: string;
  /**
   * **Defaults to `up`**, so a card that passes a `delta` and no direction renders an up arrow and
   * an sr-only "Up" the caller never asserted. State it.
   */
  deltaDir?: StatCardDeltaDir;
  /**
   * Sentiment is carried by the tint **and by a word** — `F7-12` forbids a good/bad reading resting
   * on colour alone. **Default `neutral`, deliberately:** a caller that passes only `deltaDir` gets
   * the neutral tint, the arrow, and no good/bad claim.
   */
  deltaSentiment?: StatCardSentiment;
  /** Replaces the sentiment word ("better" / "worse") with the figure's own: "behind", "over budget". */
  sentimentLabel?: string;
  /**
   * **The band the figure itself lands in** — "Good", "Fair", "Poor" (`M05-06`, `M05-40`). A
   * separate axis from `deltaSentiment`, which judges the *delta*. A `gap` suppresses it.
   */
  band?: BandSpec | string | ReactNode;
  /**
   * **Where a tier goes on a headline number.** Renders directly under the value, above the delta
   * and above `children`. A spec object, a bare tier string, or a ready `<Provenance>` node.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec | ReactNode;
  /** Makes the whole card a button — the tappable preview counts on SCR-M02-05 / SCR-M01-17. */
  onClick?: () => void;
  ariaLabel?: string;
  /**
   * e.g. a sparkline node bleeding to card edges. **Never the provenance** — its adjacency is
   * unspecified here on purpose, which is why the tier has its own slot.
   */
  children?: ReactNode;
  /**
   * **An unresolved stat never renders a numeral.** Never a zero, never a dash dressed as a value,
   * never the last figure it happened to hold.
   */
  state?: SurfaceState;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  unavailableTitle?: string;
  unavailableMessage?: string;
}
