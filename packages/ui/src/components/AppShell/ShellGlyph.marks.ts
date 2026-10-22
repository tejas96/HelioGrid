/** One mark of a glyph, on a 24-unit square: a path, a circle or a rounded rectangle. */
export type GlyphMark =
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

export const path = (d: string): GlyphMark => ({ kind: 'path', d });
export const circle = (cx: number, cy: number, r: number): GlyphMark => ({
  kind: 'circle',
  cx,
  cy,
  r,
});
export const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
): GlyphMark => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});
