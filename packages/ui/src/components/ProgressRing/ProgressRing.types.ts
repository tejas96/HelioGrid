import type { TranslatedText } from '@heliogrid/contracts';

/**
 * A figure inside a ring that shows how much of a whole it is: the days left of a trial, the days
 * to a renewal, the setup steps done. The ring is the share; the figure and its caption say it in
 * words, so the ring never carries the fact alone. It sweeps in once (transform and opacity only);
 * under reduced motion it is simply there.
 */
export interface ProgressRingProps {
  /** How far round the ring is filled, 0 to 1. */
  readonly share: number;
  /** The figure at the centre, formatted by the caller: `14`, `2/6`. */
  readonly value: string;
  /** The words under the figure — *days left*. */
  readonly caption: TranslatedText;
  /** What a screen reader says for the whole ring — *14 of 14 days left*. */
  readonly spokenName: TranslatedText;
  /** `md` beside a card's words; `lg` as a hero's figure. Default `md`. */
  readonly size?: ProgressRingSize;
  /** The ring drawn on the deep solar-glass panel (dark mode's hero), where it lightens. */
  readonly onPanel?: boolean;
}

export type ProgressRingSize = 'md' | 'lg';
