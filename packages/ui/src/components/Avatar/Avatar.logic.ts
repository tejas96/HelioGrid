import { hexToRgb, type Rgb, toHexColour } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import type { AvatarHue, IrisHue } from './Avatar.types';
import { initialsOf } from './Avatar.types';

/**
 * THE BRAND IRIS ON PEOPLE AND LABELS (design-system change 7). The wash is the hue at 14% on
 * white and the words are the hue mixed 70% with black: pure magenta measured 4.09:1 on its wash,
 * under the 4.5:1 floor, and the mix clears every hue at 4.97:1 or more. The web draws the same
 * two mixes with `color-mix()` over the tokens in `Avatar.css` — a share changed here is changed
 * there in the same commit, or the two platforms draw a person in two colours.
 */
export const IRIS_WASH_SHARE = 0.14;
export const IRIS_WORDS_SHARE = 0.7;

/** In the design system's order: the name hash indexes it, so the order is the colour a person gets. */
export const IRIS_HUES: readonly IrisHue[] = ['violet', 'blue', 'magenta'];

const IRIS_TOKEN: Record<IrisHue, string> = {
  violet: theme.colors['iris-violet'],
  blue: theme.colors['iris-blue'],
  magenta: theme.colors['iris-magenta'],
};

/* The two ends of the rule's mixes, as channels: the white a wash sits on and the black the
   words deepen to. No token carries pure black, and the rule names white, not the page. */
const WASH_BASE: Rgb = { r: 255, g: 255, b: 255 };
const WORDS_BASE: Rgb = { r: 0, g: 0, b: 0 };

/** `share` of `colour` over `base`, channel by channel — `color-mix(in srgb, c share, base)`. */
function mixed(colour: Rgb, base: Rgb, share: number): string {
  const channel = (top: number, under: number) => top * share + under * (1 - share);
  return toHexColour({
    r: channel(colour.r, base.r),
    g: channel(colour.g, base.g),
    b: channel(colour.b, base.b),
  });
}

export function isIrisHue(value: string): value is IrisHue {
  return (IRIS_HUES as readonly string[]).includes(value);
}

/** The design system's name hash, by code point, so a person is the same hue on both platforms. */
export function irisHueOf(name: string): IrisHue {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  /* The remainder always indexes the list; the fallback only satisfies the index type. */
  return IRIS_HUES[hash % IRIS_HUES.length] ?? 'violet';
}

/** The hue a disc draws, or null for the flat accent: a disc with no initials keeps the accent. */
export function avatarIris(hue: AvatarHue, name: string): IrisHue | null {
  if (hue === 'accent') return null;
  if (hue !== 'auto') return hue;
  return initialsOf(name) === '' ? null : irisHueOf(name);
}

export interface IrisTint {
  /** The wash behind the words. */
  bg: string;
  /** The words. */
  fg: string;
}

/** The iris wash and words for one of the three hues. */
export function irisTintOf(hue: IrisHue): IrisTint {
  const colour = hexToRgb(IRIS_TOKEN[hue]);
  return {
    bg: mixed(colour, WASH_BASE, IRIS_WASH_SHARE),
    fg: mixed(colour, WORDS_BASE, IRIS_WORDS_SHARE),
  };
}

/** The iris wash and words for a hue (`violet` | `blue` | `magenta`), or null. Badge uses it too. */
export function irisTint(hue: string): IrisTint | null {
  return isIrisHue(hue) ? irisTintOf(hue) : null;
}
