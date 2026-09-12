import { describe, expect, it } from 'vitest';
import {
  hexToRgb,
  isHexColour,
  normaliseHexColour,
  parseHexColour,
  toHexColour,
} from '../../src/branding/hex-colour';

describe('isHexColour — #RGB or #RRGGBB, either case', () => {
  it.each([['#abc'], ['#ABCDEF'], ['#000000']])('accepts %s', (value) => {
    expect(isHexColour(value)).toBe(true);
  });
  it.each([['abc'], ['#abcd'], ['#GGGGGG'], ['#12345'], ['']])('refuses %o', (value) => {
    expect(isHexColour(value)).toBe(false);
  });
});

describe('parseHexColour — lenient on the way in', () => {
  it.each([
    ['#abc', { r: 170, g: 187, b: 204 }],
    ['ABCDEF', { r: 171, g: 205, b: 239 }],
    ['  #ff0000  ', { r: 255, g: 0, b: 0 }],
  ])('reads %o', (input, rgb) => {
    expect(parseHexColour(input)).toEqual(rgb);
  });
  it.each([['#abcd'], ['#12345'], ['red'], [''], [42], [null], [undefined]])(
    'answers null for %o',
    (input) => {
      expect(parseHexColour(input)).toBeNull();
    },
  );
});

describe('hexToRgb — the strict shape, or a defect', () => {
  it('reads the contract shape', () => {
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
  });
  it.each([['0000FF'], ['red'], ['']])('throws on %o', (input) => {
    expect(() => hexToRgb(input)).toThrow(RangeError);
  });
});

describe('toHexColour — rounded, held to 0–255, upper case', () => {
  it.each([
    [{ r: 0, g: 0, b: 0 }, '#000000'],
    [{ r: 255, g: 255, b: 255 }, '#FFFFFF'],
    [{ r: 12.4, g: 12.6, b: 1 }, '#0C0D01'],
    [{ r: 300, g: -20, b: 255.4 }, '#FF00FF'],
  ])('%o is %s', (rgb, hex) => {
    expect(toHexColour(rgb)).toBe(hex);
  });
});

describe('normaliseHexColour — strict on the way out', () => {
  it.each([
    ['#abc', '#AABBCC'],
    ['abcdef', '#ABCDEF'],
    [' #ABC ', '#AABBCC'],
  ])('%o becomes %s', (input, hex) => {
    expect(normaliseHexColour(input)).toBe(hex);
  });
  it.each([['#abcd'], ['zzz'], [7]])('answers null for %o', (input) => {
    expect(normaliseHexColour(input)).toBeNull();
  });
});
