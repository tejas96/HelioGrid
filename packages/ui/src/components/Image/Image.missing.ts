import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { ImageMissingReason } from './Image.types';

export type ImageGlyphName = 'no-image' | 'no-cloud' | 'eye';

/** The shape each frame mark draws. */
export const IMAGE_GLYPH: Record<ImageGlyphName, ShellGlyphName> = {
  'no-image': 'image-off',
  'no-cloud': 'cloud-off',
  eye: 'eye-wide',
};

/** How one kind of missing looks; its words are `ImageWords.missing`. */
export interface ImageMissingSpec {
  tone: 'neutral' | 'warning';
  icon: ImageGlyphName;
}

/**
 * Two kinds of missing are NOT the same fact, so they don't look the same (honesty):
 *
 * - `not-captured` — nobody took this photo. Neutral, permanent, no retry.
 * - `unavailable` — the fetch failed. Warning tint, offers a retry.
 *
 * One declaration for both platforms, so a missing frame looks the same on a phone as on a
 * printed proposal.
 */
export const IMAGE_MISSING: Record<ImageMissingReason, ImageMissingSpec> = {
  'not-captured': { tone: 'neutral', icon: 'no-image' },
  unavailable: { tone: 'warning', icon: 'no-cloud' },
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
