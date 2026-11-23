import { describe, expect, it } from 'vitest';
import { droneRgbaOf } from '../../src/studio/drone-pixels';

/**
 * A drone map's pixels as a piece draws them (`T-M05-002d`): its own see-through band kept, and a
 * pixel the file names as empty made see-through, so a map's ragged edge never shows black or white.
 */
describe('droneRgbaOf', () => {
  it.each([
    [
      'three bands, no empty value: every pixel shows',
      [10, 20, 30, 0, 0, 0],
      3,
      null,
      [255, 255],
      false,
    ],
    [
      'three bands, an empty value of 0: the black pixel is see-through',
      [10, 20, 30, 0, 0, 0],
      3,
      0,
      [255, 0],
      true,
    ],
    [
      'three bands, an empty value of 255: a pixel with one band off it shows',
      [255, 255, 254, 255, 255, 255],
      3,
      255,
      [255, 0],
      true,
    ],
    [
      'four bands: the map’s own band is kept',
      [10, 20, 30, 255, 0, 0, 0, 0],
      4,
      null,
      [255, 0],
      true,
    ],
    ['four bands, all shown', [10, 20, 30, 255, 1, 2, 3, 255], 4, null, [255, 255], false],
  ] as const)('%s', (_why, samples, bands, empty, alphas, seeThrough) => {
    const read = droneRgbaOf(Uint8Array.from(samples), bands, 2, empty);
    expect([read.rgba[3], read.rgba[7]]).toEqual(alphas);
    expect(read.seeThrough).toBe(seeThrough);
    expect(Array.from(read.rgba.slice(0, 3))).toEqual(samples.slice(0, 3));
  });
});
