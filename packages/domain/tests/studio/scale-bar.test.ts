import { describe, expect, it } from 'vitest';
import { scaleBarOf } from '../../src/studio/scale-bar';

describe('the scale bar', () => {
  it.each([
    // metres a pixel, longest bar → the round length, its pixels
    [0.1, 100, 10, 100],
    [0.1, 99, 5, 50],
    [0.5, 100, 50, 100],
    [0.01, 100, 1, 100],
    [5, 100, 500, 100],
  ])('metric: %s m a pixel in %s px shows %s m over %s px', (perPixel, max, metres, pixels) => {
    const bar = scaleBarOf(perPixel, 'metric', max);
    expect(bar?.metres).toBe(metres);
    expect(bar?.pixels).toBeCloseTo(pixels);
  });

  it('imperial: round feet, held in metres', () => {
    expect(scaleBarOf(0.1, 'imperial', 100)?.metres).toBeCloseTo(20 * 0.3048);
  });

  it.each([
    ['nothing fits', 0.1, 5],
    ['no ground per pixel', 0, 100],
    ['a broken reading', Number.NaN, 100],
    ['no room', 0.1, 0],
  ])('%s: no bar', (_why, perPixel, max) => {
    expect(scaleBarOf(perPixel, 'metric', max)).toBeNull();
  });
});
