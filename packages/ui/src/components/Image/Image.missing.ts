import type { ImageMissingReason } from './Image.types';

export type ImageGlyphName = 'no-image' | 'no-cloud' | 'eye';

export interface ImageMissingSpec {
  tone: 'neutral' | 'warning';
  icon: ImageGlyphName;
  label: string;
  detail: string;
}

/**
 * Two kinds of missing are NOT the same fact, so they don't look the same (honesty):
 *
 * - `not-captured` — nobody took this photo. Neutral, permanent, no retry.
 * - `unavailable` — the fetch failed. Warning tint, offers a retry.
 *
 * One declaration for both platforms, so a missing frame says the same words on a phone as on a
 * printed proposal.
 */
export const IMAGE_MISSING: Record<ImageMissingReason, ImageMissingSpec> = {
  'not-captured': {
    tone: 'neutral',
    icon: 'no-image',
    label: 'Not captured',
    detail: 'No photo was taken here.',
  },
  unavailable: {
    tone: 'warning',
    icon: 'no-cloud',
    label: 'Image unavailable',
    detail: "This image didn't load. Try again.",
  },
};

/** The named footprints. Anything else is passed through as a CSS aspect-ratio verbatim. */
export const IMAGE_RATIOS: Record<string, string> = {
  photo: '4 / 3',
  wide: '16 / 9',
  square: '1 / 1',
  portrait: '3 / 4',
};

/** Below 140px the icon carries the state and the accessible name carries the words. */
export const IMAGE_COMPACT_BELOW = 140;
/** …and below 88px there is not even room for the label. */
export const IMAGE_LABEL_ABOVE = 88;
