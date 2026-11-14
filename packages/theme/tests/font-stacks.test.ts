import { describe, expect, it } from 'vitest';
import { BUNDLED_FACES, FONT_STACKS } from '../src/tokens/typography';

/**
 * Hindi and Marathi words reach every face the product sets — a date in the mono face reads
 * `14 नोव्हें 2026` — so each stack must name a bundled Devanagari face, or the browser falls back
 * to whatever the machine holds and a generated document embeds an operating system's font
 * (`F3-15`: the script face is bundled into the renderer's runtime).
 */
describe('every font stack reaches a bundled Devanagari face', () => {
  const bundled = BUNDLED_FACES.map((face) => face.family);
  const devanagari = bundled.filter((family) => family.includes('Devanagari'));

  it.each(Object.entries(FONT_STACKS))('the %s stack names one', (_, stack) => {
    expect(stack.some((family) => devanagari.includes(family))).toBe(true);
  });
});
