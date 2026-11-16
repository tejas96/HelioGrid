import type { TranslatedText } from '@heliogrid/contracts';
import type { ThemeColor } from '../../primitives/Color/colors';

/** One part of a whole: its key, its count and, when the colour says which part, its ink. */
export interface SegmentBarPart {
  readonly key: string;
  readonly count: number;
  /** The part's own ink — a share's hue. None draws the accent. */
  readonly ink?: ThemeColor;
}

/**
 * **The one share bar**: a row of parts, each as wide as its share of the whole — a pipeline by
 * stage, a list's parts. A part with none takes no room, unless `keepEmpty` holds a place for every
 * part while nothing is counted (an empty pipeline still draws its stages). A part too thin to see
 * holds a floor. The bar is one image named by `label`; without one it is hidden, since the words
 * beside it say every count.
 */
export interface SegmentBarProps {
  readonly parts: readonly SegmentBarPart[];
  /** `sm` a hairline bar (4), `md` a summary's (8), `lg` a filter's (12). Default `md`. */
  readonly size?: 'sm' | 'md' | 'lg';
  /** Every part an even place while every count is 0. Default `false`. */
  readonly keepEmpty?: boolean;
  /** Each later part a step lighter, so a run reads left to right as one fading accent. */
  readonly fade?: boolean;
  readonly label?: TranslatedText;
}

/** One part as the bar draws it. */
export interface SegmentBarSegment {
  readonly key: string;
  /** Its share of the whole, 0–1. */
  readonly share: number;
  /** Under the floor: it draws at the floor's width. */
  readonly thin: boolean;
  readonly ink?: ThemeColor;
  readonly opacity: number;
}
