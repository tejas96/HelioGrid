import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import {
  automaticLineUpOf,
  type PicturePixels,
  pictureToWire,
  SHIFT_STEP_M,
} from '../../src/studio/site-shift';

/**
 * The studio lines the height map up by itself (`T-M05-002g`, step 1): the straight-down picture,
 * which lies on the height map, is matched by its edges to the picture the roofs were drawn on.
 * Synthetic pictures: no Google data is kept in the repo (Solar terms §21.2).
 */

/** Houses on a street: bright blocks on dark ground, irregular so one shift alone fits. */
const BLOCKS = [
  [-20, -15, -8, -4],
  [-4, -18, 6, -9],
  [10, -12, 24, 2],
  [-22, 4, -10, 18],
  [0, 6, 7, 20],
  [12, 10, 19, 15],
] as const;
const brightAt = (p: GroundPoint) =>
  BLOCKS.some(([w, s, e, n]) => p.east >= w && p.east < e && p.north >= s && p.north < n)
    ? 0.9
    : 0.15;

/** The straight-down picture, half a metre a cell round the pin. */
function straightDown() {
  const stepM = 0.5;
  const cols = 120;
  const values = new Float32Array(cols * cols);
  for (let row = 0; row < cols; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      values[row * cols + col] = brightAt({
        east: -30 + (col + 0.5) * stepM,
        north: -30 + (row + 0.5) * stepM,
      });
    }
  }
  return pictureToWire({ west: -30, south: -30, stepM, cols, rows: cols, values });
}

/** The sky picture: the same ground seen `shift` off, 25 cm a pixel, row 0 the north. */
function skyPicture(shift: GroundPoint): PicturePixels {
  const width = 320;
  const rgba = new Uint8ClampedArray(width * width * 4);
  for (let y = 0; y < width; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const grey = Math.round(
        brightAt({
          east: -40 + (x + 0.5) * 0.25 - shift.east,
          north: 40 - (y + 0.5) * 0.25 - shift.north,
        }) * 255,
      );
      rgba.set([grey, grey, grey, 255], (y * width + x) * 4);
    }
  }
  return { rgba, width, height: width, west: -40, south: -40, east: 40, north: 40 };
}

describe('the automatic line-up', () => {
  it.each([
    ['1 m east, 50 cm south', { east: 1, north: -0.5 }],
    ['2.5 m west, 1.25 m north', { east: -2.5, north: 1.25 }],
    ['none', { east: 0, north: 0 }],
  ])('a picture %s of the map moves the map there', (_, shift) => {
    const lineUp = automaticLineUpOf([skyPicture(shift)], straightDown(), 1);
    // Good to one step of the search, 25 cm: the straight-down picture is half a metre a cell.
    expect(Math.abs((lineUp?.east ?? 9) - shift.east)).toBeLessThanOrEqual(SHIFT_STEP_M);
    expect(Math.abs((lineUp?.north ?? 9) - shift.north)).toBeLessThanOrEqual(SHIFT_STEP_M);
    expect(lineUp?.lift).toBe(0);
  });

  it('the picture as stretched by the first true length is the one matched', () => {
    const picture = skyPicture({ east: 0, north: 0 });
    const shrunk = {
      ...picture,
      west: -40 / 1.02,
      east: 40 / 1.02,
      south: -40 / 1.02,
      north: 40 / 1.02,
    };
    const lineUp = automaticLineUpOf([shrunk], straightDown(), 1.02);
    expect(Math.hypot(lineUp?.east ?? 9, lineUp?.north ?? 9)).toBeLessThan(0.3);
  });

  it('a featureless picture, or none, leaves the map where the data laid it', () => {
    const blank = {
      ...skyPicture({ east: 0, north: 0 }),
      rgba: new Uint8ClampedArray(320 * 320 * 4).fill(128),
    };
    expect(automaticLineUpOf([blank], straightDown(), 1)).toBeNull();
    expect(automaticLineUpOf([], straightDown(), 1)).toBeNull();
  });
});
