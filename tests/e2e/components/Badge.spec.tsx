import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Badge } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { contrast, IRIS_HUES, irisTintOf } from '../support/iris';

const en = await createTranslator('en');
const words = en.t(SIGN_IN.tryAgain);

/**
 * A computed colour to `#rrggbb`. A `color-mix` result comes back as `color(srgb r g b)` with
 * channels from 0 to 1; a plain colour comes back as `rgb(r, g, b)` with channels from 0 to 255.
 */
function hexOf(computed: string): string {
  const scale = computed.startsWith('color(srgb') ? 255 : 1;
  const parts =
    computed
      .match(/\d+(\.\d+)?/g)
      ?.slice(0, 3)
      .map((part) => Math.round(Number(part) * scale)) ?? [];
  return `#${parts.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** The largest gap between two colours' channels — `color-mix` may round a channel the other way. */
function channelGap(a: string, b: string): number {
  const channels = (hex: string) =>
    [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  const [x, y] = [channels(a), channels(b)];
  return Math.max(...x.map((value, index) => Math.abs(value - (y[index] ?? 0))));
}

for (const hue of IRIS_HUES) {
  test(`the ${hue} iris badge draws the phone's colours, and its words read at 4.5:1 or more (design-system change 7)`, async ({
    mount,
  }) => {
    const badge = await mount(<Badge tone={hue}>{words}</Badge>);
    const drawn = await badge.evaluate((node) => {
      const style = getComputedStyle(node);
      return { fg: style.color, bg: style.backgroundColor };
    });
    const phone = irisTintOf(hue);
    expect(channelGap(hexOf(drawn.bg), phone.bg.toUpperCase())).toBeLessThanOrEqual(1);
    expect(channelGap(hexOf(drawn.fg), phone.fg.toUpperCase())).toBeLessThanOrEqual(1);
    expect(contrast(phone.fg, phone.bg)).toBeGreaterThanOrEqual(4.5);
  });
}
