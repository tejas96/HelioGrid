/**
 * A drone map's pixels as a piece draws them (`T-M05-002d`): the map's own see-through band kept,
 * and a pixel whose every band is the value the file names as empty (GDAL's no-data) made
 * see-through — so a map's ragged edge lies on the ground, never as a black or white frame.
 */

const RGB = 3;
const RGBA = 4;
const OPAQUE = 255;

/**
 * Interleaved samples of `bands` per pixel (3: RGB, 4: RGB and the map's see-through band) as RGBA,
 * and whether any pixel is see-through: such a piece keeps its edge (a WebP or a PNG, never a JPEG).
 */
export function droneRgbaOf(
  samples: Uint8Array,
  bands: number,
  pixels: number,
  empty: number | null,
): { readonly rgba: Uint8ClampedArray; readonly seeThrough: boolean } {
  const rgba = new Uint8ClampedArray(pixels * RGBA);
  let seeThrough = false;
  for (let p = 0; p < pixels; p++) {
    const from = p * bands;
    const to = p * RGBA;
    const r = samples[from] ?? 0;
    const g = samples[from + 1] ?? 0;
    const b = samples[from + 2] ?? 0;
    rgba[to] = r;
    rgba[to + 1] = g;
    rgba[to + 2] = b;
    const own = bands >= RGBA ? (samples[from + RGB] ?? OPAQUE) : OPAQUE;
    const blank = empty !== null && r === empty && g === empty && b === empty;
    const alpha = blank ? 0 : own;
    rgba[to + RGB] = alpha;
    if (alpha < OPAQUE) seeThrough = true;
  }
  return { rgba, seeThrough };
}
