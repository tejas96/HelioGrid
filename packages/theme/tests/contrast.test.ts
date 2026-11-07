import { describe, expect, it } from 'vitest';
import { DECLARED_PAIRS, type DeclaredPair, measurePairs } from '../src/contrast';
import { COLOR_TOKENS, DARK, FIELD_PALETTE, LIGHT, type ThemePalette } from '../src/tokens/colors';

const MODES: readonly [string, ThemePalette][] = [
  ['light', LIGHT],
  ['dark', DARK],
  ['field', FIELD_PALETTE],
];

describe('every declared colour pair keeps its floor', () => {
  it.each(MODES)('in %s mode', (_mode, palette) => {
    const failing = measurePairs(palette).filter((p) => !p.passes);
    expect(failing.map((p) => `${p.fg} on ${p.bg} = ${p.ratio} < ${p.floor}`)).toEqual([]);
  });

  it('refuses a planted pair under its floor', () => {
    const planted: DeclaredPair = {
      fg: 'text-tertiary',
      bg: 'canvas-sunken',
      role: 'planted',
      floor: 4.5,
    };
    const grey: ThemePalette = { ...LIGHT, 'text-tertiary': '#9AA1AA' };
    expect(measurePairs(grey, [planted])[0]?.passes).toBe(false);
  });
});

describe('every palette names every colour', () => {
  it.each(MODES)('%s holds each token once, as a colour', (_mode, palette) => {
    for (const token of COLOR_TOKENS) {
      expect(palette[token], token).toMatch(/^(#[0-9A-F]{6}|rgba\(\d+,\d+,\d+,[\d.]+\))$/);
    }
  });

  it('declares no pair twice', () => {
    const keys = DECLARED_PAIRS.map((p) => `${p.fg}/${p.bg}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
