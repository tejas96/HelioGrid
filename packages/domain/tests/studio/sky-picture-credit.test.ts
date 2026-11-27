import { describe, expect, it } from 'vitest';
import { boxWithoutStrip, creditStripOf } from '../../src/studio/sky-picture-credit';

/**
 * Google's Static Maps picture is laid without the credit burned into its foot (`T-M05-002`): its
 * south moves north by the strip's share, so what is left still lies where it was photographed.
 */

const PICTURE = { west: -91.5, east: 91.5, south: -91.4, north: 91.6 };

describe('the strip a provider burns into its picture (T-M05-002)', () => {
  it.each([
    ['Static Maps carries Google’s credit', 'google', 24 / 640],
    ['the straight-down picture carries none', 'google_solar', 0],
    ['a source a newer api learned carries none', 'other', 0],
  ] as const)('%s', (_why, source, strip) => {
    expect(creditStripOf(source)).toBe(strip);
  });
});

describe('the ground left once the strip is cut (T-M05-002)', () => {
  it.each([
    // why, strip → south
    ['no strip: the box as it is', 0, -91.4],
    ['a negative share cuts nothing', -0.1, -91.4],
    ['Static Maps’ strip: 6.86 m of 183 m', 24 / 640, -91.4 + 183 * (24 / 640)],
    ['all of it: south meets north', 1, 91.6],
  ] as const)('%s', (_why, strip, south) => {
    const cut = boxWithoutStrip(PICTURE, strip);
    expect(cut.south).toBeCloseTo(south, 9);
    expect({ ...cut, south: 0 }).toEqual({ ...PICTURE, south: 0 });
  });

  it('keeps what else the piece holds', () => {
    const piece = { ...PICTURE, image: 'data:image/jpeg;base64,' };
    expect(boxWithoutStrip(piece, 24 / 640).image).toBe(piece.image);
  });
});
