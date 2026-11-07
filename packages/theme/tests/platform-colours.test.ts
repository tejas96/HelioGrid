import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DARK, LIGHT } from '../src/tokens/colors';

/** The iOS launch screen cannot read the theme, so its colour set is held equal to `--canvas`. */
const SPLASH = new URL(
  '../../../apps/mobile/ios/HelioGridMobile/Images.xcassets/SplashCanvas.colorset/Contents.json',
  import.meta.url,
);

interface ColourEntry {
  appearances?: { value: string }[];
  color: { components: { red: string; green: string; blue: string } };
}

const hexOf = (e: ColourEntry) =>
  `#${[e.color.components.red, e.color.components.green, e.color.components.blue]
    .map((c) => c.replace('0x', ''))
    .join('')}`.toUpperCase();

describe('the iOS launch screen follows the canvas token', () => {
  const entries: ColourEntry[] = JSON.parse(readFileSync(SPLASH, 'utf8')).colors;

  it.each([
    ['light', undefined, LIGHT.canvas],
    ['dark', 'dark', DARK.canvas],
  ])('in %s', (_mode, appearance, canvas) => {
    const entry = entries.find((e) => e.appearances?.[0]?.value === appearance);
    expect(entry && hexOf(entry)).toBe(canvas);
  });
});
