import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  MARK_CONTRAST_FLOOR,
  TEXT_CONTRAST_FLOOR,
} from '../../src/branding/contrast';

describe('contrastRatio — WCAG 2.x, symmetric', () => {
  it.each([
    ['#000000', '#FFFFFF', 21],
    ['#FFFFFF', '#000000', 21],
    ['#777777', '#777777', 1],
    ['#006FFF', '#FFFFFF', 4.45],
    ['#0A0A0B', '#FFFFFF', 19.79],
  ])('%s against %s is %d', (a, b, ratio) => {
    expect(contrastRatio(a, b)).toBeCloseTo(ratio, 1);
  });

  it('measures both sides of the sRGB knee', () => {
    expect(contrastRatio('#0A0A0A', '#000000')).toBeCloseTo(1.06, 2);
    expect(contrastRatio('#0B0B0B', '#000000')).toBeCloseTo(1.07, 2);
  });

  it('takes the strict shape only', () => {
    expect(() => contrastRatio('006FFF', '#FFFFFF')).toThrow(RangeError);
  });

  it('the design system’s own edge sits between the two floors', () => {
    const ratio = contrastRatio('#006FFF', '#FFFFFF');
    expect(ratio).toBeLessThan(TEXT_CONTRAST_FLOOR);
    expect(ratio).toBeGreaterThanOrEqual(MARK_CONTRAST_FLOOR);
  });
});
