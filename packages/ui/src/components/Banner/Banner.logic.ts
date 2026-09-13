import type { BannerGlyph } from './Banner.types';

/**
 * The banner glyphs, as geometry rather than markup. Each is a list of `d` strings plus whether
 * the outline is ringed, because the two halves draw with different elements — `<path>`/`<circle>`
 * on web, `react-native-svg`'s `<Path>`/`<Circle>` on RN — and only the SHAPE is shared (`M118`).
 * The halves used to hold the same outlines in two encodings, which is how one platform keeps an
 * old glyph after the other is corrected.
 *
 * A `d` string is SVG path data on a 24x24 grid, never an identifier: `M x y` moves the pen,
 * `h`/`v` draw a horizontal or vertical line, `l` a line to a point, `c` a curve. So `M12 9v4`
 * reads "pen to the middle, draw 4 down" — a coordinate, and never a ledger row id.
 */
export interface BannerGlyphShape {
  readonly paths: readonly string[];
  /** A ringed glyph draws a 9-radius circle about the centre, under the paths. */
  readonly ringed: boolean;
}

export const BANNER_GLYPH: Record<BannerGlyph, BannerGlyphShape> = {
  alert: { paths: ['M12 9v4M12 17h.01'], ringed: true },
  info: { paths: ['M12 11v5M12 8h.01'], ringed: true },
  rupee: { paths: ['M7 5h10M7 9h10M15 5c0 4-3.5 4-8 4l8 10'], ringed: false },
  review: { paths: ['M12 3 3 20h18z', 'M12 10v4M12 17h.01'], ringed: false },
  spark: {
    paths: [
      'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
    ],
    ringed: false,
  },
};
