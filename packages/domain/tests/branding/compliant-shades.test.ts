import { describe, expect, it } from 'vitest';
import { compliantShades } from '../../src/branding/compliant-shades';
import { contrastRatio, TEXT_CONTRAST_FLOOR } from '../../src/branding/contrast';

describe('compliantShades — measured, never refused (F7-07, M01-50)', () => {
  it('returns a readable colour as it is, normalised, and lets white sit on it', () => {
    expect(compliantShades('#0000ff')).toEqual({
      brand: '#0000FF',
      ink: '#0000FF',
      whiteOnBrand: true,
    });
    expect(compliantShades('#000')).toEqual({
      brand: '#000000',
      ink: '#000000',
      whiteOnBrand: true,
    });
  });

  it.each([
    ['#FF0000', /^#[0-9A-F]{2}0000$/],
    ['#00FF00', /^#00[0-9A-F]{2}00$/],
    ['#FFFF00', /^#([0-9A-F]{2})\1{1}00$/],
    ['#00FFFF', /^#00([0-9A-F]{2})\1$/],
    ['#FF00FF', /^#([0-9A-F]{2})00\1$/],
    ['#66AAFF', /^#[0-9A-F]{6}$/],
    ['#006FFF', /^#[0-9A-F]{6}$/],
  ])('darkens %s along its own hue until words can sit on paper', (brand, sameHue) => {
    const shades = compliantShades(brand);
    expect(shades.brand).toBe(brand);
    expect(shades.ink).not.toBe(brand);
    expect(shades.ink).toMatch(sameHue);
    expect(contrastRatio(shades.ink, '#FFFFFF')).toBeGreaterThanOrEqual(TEXT_CONTRAST_FLOOR);
    expect(contrastRatio(brand, '#FFFFFF')).toBeLessThan(TEXT_CONTRAST_FLOOR);
  });

  it('answers the design system’s own edge the same way: #006FFF cannot carry white', () => {
    expect(compliantShades('#006FFF').whiteOnBrand).toBe(false);
  });

  it('keeps a grey grey — no hue is invented for a colour that has none', () => {
    const { ink } = compliantShades('#FFFFFF');
    expect(ink).toMatch(/^#([0-9A-F]{2})\1\1$/);
    expect(contrastRatio(ink, '#FFFFFF')).toBeGreaterThanOrEqual(TEXT_CONTRAST_FLOOR);
    expect(compliantShades('#888888').ink).toMatch(/^#([0-9A-F]{2})\1\1$/);
  });

  it('refuses only what is not a colour at all — the contract already stops that', () => {
    expect(() => compliantShades('red')).toThrow(RangeError);
  });
});
