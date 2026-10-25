import { parseHexColour, toHexColour } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import type { ShareFilterItem } from './ShareFilter.types';

/**
 * The phone's spelling of the web half's `color-mix()` washes and inks: react-native has no custom
 * properties and no `color-mix`, so each mix is worked out here from the resolved tokens. A share
 * changed here is changed in `ShareFilter.css` (and `FileChip.css`) in the same commit, or the two
 * platforms draw the same part in two colours.
 */

/** A part's hue as its token — the web half's `--hg-share-hue`. */
export const HUE_INK: Record<ShareFilterItem['hue'], string> = {
  blue: theme.colors['iris-blue'],
  violet: theme.colors['iris-violet'],
  warning: theme.colors['warning-text'],
  success: theme.colors.success,
  danger: theme.colors.danger,
};

/** A pressed ring's wash: its hue at 12% over the ground. */
export const RING_PRESSED_SHARE = 0.12;

/** A pressed count button's wash: its hue at 14% over the ground. */
export const COUNT_PRESSED_SHARE = 0.14;

/** `share` of `colour` over `under`, channel by channel — `color-mix(in srgb, c share, under)`. */
export function inkOver(colour: string, under: string, share: number): string {
  const top = parseHexColour(colour);
  const base = parseHexColour(under);
  if (top === null || base === null) return under;
  const channel = (above: number, beneath: number) => above * share + beneath * (1 - share);
  return toHexColour({
    r: channel(top.r, base.r),
    g: channel(top.g, base.g),
    b: channel(top.b, base.b),
  });
}

/** A part that asks: its label in the warning ink 72% over the primary words, as the web mixes it. */
export const WARNING_WORDS = inkOver(
  theme.colors['warning-text'],
  theme.colors['text-primary'],
  0.72,
);
