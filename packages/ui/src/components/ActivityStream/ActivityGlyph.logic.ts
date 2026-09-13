/**
 * The kind glyphs, as SHAPES rather than markup. The two halves used to hold the same outlines in
 * two encodings — JSX on web, path strings plus four hand-written special cases on native — which
 * is worse than a copy: neither file looks like the other, so nobody compares them, and a
 * corrected outline lands on one platform for good.
 *
 * A `d` string is SVG path data on a 24x24 grid, never an identifier: `M x y` moves the pen,
 * `h`/`v` draw a horizontal or vertical line, `l` a line to a point, `c`/`a` a curve or arc. So
 * `M12 4v2` reads "pen to the top middle, draw 2 down" — a coordinate, and never a ledger row id.
 *
 * `agent` is absent on purpose: brand and AI affordances are a gradient-filled object rather than
 * an outlined icon (`F7-06`), and each half draws that object with its own platform's gradient.
 */
export type GlyphShape =
  | { readonly kind: 'path'; readonly d: string }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number }
  | {
      readonly kind: 'rect';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rx: number;
    };

const path = (d: string): GlyphShape => ({ kind: 'path', d });
const circle = (cx: number, cy: number, r: number): GlyphShape => ({ kind: 'circle', cx, cy, r });
const rect = (x: number, y: number, width: number, height: number, rx: number): GlyphShape => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});

/** The glyph an unknown kind falls back to, so a stream never renders an empty box. */
export const FALLBACK_GLYPH = 'dot';

export const ACTIVITY_GLYPH: Record<string, readonly GlyphShape[]> = {
  note: [path('M5 4h11l3 3v13H5z'), path('M9 11h6M9 15h4')],
  phone: [
    path(
      'M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z',
    ),
  ],
  flag: [path('M6 21V4h12l-2.5 4L18 12H6')],
  user: [circle(12, 8, 3.2), path('M5.5 20a6.5 6.5 0 0 1 13 0')],
  doc: [path('M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z'), path('M14 3v5h5')],
  link: [
    path('M10 13a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1'),
    path('M14 11a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1'),
  ],
  clipboard: [rect(6, 4, 12, 17, 2), path('M9 3h6v3H9zM9 12h6M9 16h4')],
  grid: [
    rect(4, 4, 7, 7, 1.5),
    rect(13, 4, 7, 7, 1.5),
    rect(4, 13, 7, 7, 1.5),
    rect(13, 13, 7, 7, 1.5),
  ],
  check: [path('m5 13 4 4L19 7')],
  rupee: [path('M8 5h8M8 9h8M14 5c0 4-2.5 4-6 4l7 10')],
  cog: [
    circle(12, 12, 3),
    path('M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5 8 8M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5'),
  ],
  bell: [path('M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z'), path('M10 19a2 2 0 0 0 4 0')],
  undo: [path('M4 10h9a5 5 0 1 1 0 10H8'), path('m8 6-4 4 4 4')],
  dot: [circle(12, 12, 3.5)],
};
