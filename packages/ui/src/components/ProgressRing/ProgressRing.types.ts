import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ThemeColor } from '../../primitives/Color/colors';

/**
 * **The one progress ring**: a share of a whole drawn round a centre — the days left of a trial, the
 * setup steps done, a run's count, one part's share of a list, a person's load round their face. It
 * sweeps in once (transform and opacity only); under reduced motion it is simply there.
 *
 * Two forms. A **figure** ring says its share in words at the centre — `value`, `caption` and the
 * `spokenName` a screen reader hears for the whole — so the ring never carries the fact alone. A
 * **bare** ring holds whatever its holder puts at the centre (`children`: a count, a face) and the
 * holder names the whole, as a progress bar's or a toggle's own name does.
 */
export type ProgressRingProps = ProgressRingBase & (ProgressRingFigure | ProgressRingBare);

interface ProgressRingBase {
  /** How far round the ring is filled, 0 to 1. */
  readonly share: number;
  /** Default `md`. */
  readonly size?: ProgressRingSize;
  /** The ring drawn on the deep solar-glass panel (dark mode's hero), where it lightens. */
  readonly onPanel?: boolean;
  /**
   * One flat ink for the arc on a well track — a part's hue, a late load's warning — instead of the
   * brand sweep. Use it where the ring's colour says WHICH, never for a figure a screen is about.
   */
  readonly ink?: ThemeColor;
}

interface ProgressRingFigure {
  /** The figure at the centre, formatted by the caller: `14`, `2/6`. */
  readonly value: string;
  /** The words under the figure — *days left*. */
  readonly caption: TranslatedText;
  /** What a screen reader says for the whole ring — *14 of 14 days left*. */
  readonly spokenName: TranslatedText;
  readonly children?: never;
}

interface ProgressRingBare {
  readonly value?: never;
  readonly caption?: never;
  readonly spokenName?: never;
  /** What sits at the centre; its holder names the whole. */
  readonly children?: ReactNode;
}

/**
 * Smallest first: `face` round a person's face (48), `sm` a count beside its words (56, the figure in
 * the mono face and the caption spoken only — no room to print it), `dial` one part's share (64),
 * `md` beside a card's words (128), `run` a run's count (132), `lg` a hero's figure (160).
 */
export type ProgressRingSize = 'face' | 'sm' | 'dial' | 'md' | 'run' | 'lg';
