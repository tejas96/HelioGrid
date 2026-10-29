import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { BandSpec } from '../BandedFigure';
import type { NamedGapInput } from '../NamedGap';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { SurfaceRead, SurfaceState } from '../UnavailableNote';

/** **Which way the figure moved, and nothing more.** `flat` draws a bar: zero has no direction. */
export type StatCardDeltaDir = 'up' | 'down' | 'flat';

/** **Whether that movement is good news** — a separate fact, because the component cannot infer it. */
export type StatCardSentiment = 'good' | 'bad' | 'neutral';

/** The words a stat card says itself, in the reader's language (`@heliogrid/i18n`'s `statCardWords`). */
export interface StatCardWords {
  /** What a screen reader hears while the figure loads — *Loading {label}*, the card's own label. */
  loading(label: string): TranslatedText;
  /**
   * The delta as a screen reader hears it — *Up 12%*, *Down 3%*, *No change 0%*: the direction
   * the hidden arrow shows, with the figure where the reader's language puts it.
   */
  moved(dir: StatCardDeltaDir, delta: string): TranslatedText;
  /** The sentiment word after a good delta. */
  better: TranslatedText;
  /** The sentiment word after a bad delta. */
  worse: TranslatedText;
}

export interface StatCardProps {
  /** uppercase overline micro-label */
  label: TranslatedText;
  /** The card's own words — its loading name and the delta's direction and sentiment. */
  words: StatCardWords;
  /**
   * The number. Pass a **number** and the market pack formats it (`F1` / `F3-20`); pass a string
   * only when the caller genuinely owns the text.
   *
   * **Required.** An absent figure has two sanctioned routes and neither is an omitted `value`:
   * `gap` names what is missing in the value's own footprint, and a non-ready `read` says the
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
   * statement from an `empty` read. A gap **suppresses the delta and the provenance slot**: a delta
   * of an absent value is arithmetic on nothing, and a tier answers *how a figure was arrived at*,
   * which has no answer when there is no figure.
   */
  gap?: NamedGapInput;
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
  sentimentLabel?: TranslatedText;
  /**
   * **The band the figure itself lands in** — "Good", "Fair", "Poor" (`M05-06`, `M05-40`). A
   * separate axis from `deltaSentiment`, which judges the *delta*. A `gap` suppresses it.
   */
  band?: BandSpec | string | ReactNode;
  /**
   * **Where a tier goes on a headline number.** Renders directly under the value, above the delta
   * and above `children`. A spec object or a bare tier.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  /** Makes the whole card a button — the tappable preview counts on SCR-M02-05 / SCR-M01-17. */
  onClick?: () => void;
  ariaLabel?: TranslatedText;
  /**
   * e.g. a sparkline node bleeding to card edges. **Never the provenance** — its adjacency is
   * unspecified here on purpose, which is why the tier has its own slot.
   */
  children?: ReactNode;
  /**
   * **An unresolved stat never renders a numeral.** Never a zero, never a dash dressed as a value,
   * never the last figure it happened to hold.
   *
   * **Required:** what this draws always comes from a read. `failed` draws the error with its
   * retry; `unavailable` draws none.
   */
  read: SurfaceRead;
  /**
   * Each state's words are drawn only when given — `@heliogrid/i18n`'s `STAT_CARD` holds the
   * usual ones.
   */
  emptyMessage?: TranslatedText;
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
}

/** The states' words and acts — every word the caller's, each drawn only when given. */
export interface StatCardStatesProps {
  state: SurfaceState;
  loadingLabel: TranslatedText;
  emptyMessage?: TranslatedText;
  errorMessage?: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  /** The card's frame, where focus lands once its retry has left. */
  focusAfter: FocusAfter;
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
}

/** The change under the figure, as both halves draw it. */
export interface StatCardDeltaProps {
  delta?: string;
  dir: StatCardDeltaDir;
  sentiment: StatCardSentiment;
  sentimentLabel?: TranslatedText;
  words: StatCardWords;
  /** The figure is a named gap, so there is nothing for a delta to be a change IN. */
  suppressed: boolean;
}
