import { colors, type ThemeColor } from '../../primitives/Color/colors';
import type { AvatarHue, CategoryHue } from './Avatar.types';
import { initialsOf } from './Avatar.types';

/**
 * THE CATEGORY HUES: a person's tint, a role's kind, a rate's basis — who or what a thing is, never
 * its state. Each hue is a token pair, a wash and its words, measured in light and dark, so nothing
 * is mixed at run time and both platforms draw one colour.
 */
export const CATEGORY_HUES: readonly CategoryHue[] = ['ocean', 'teal', 'plum'];

export function isCategoryHue(value: string): value is CategoryHue {
  return (CATEGORY_HUES as readonly string[]).includes(value);
}

/** The design system's name hash, by code point, so a person is the same hue on both platforms. */
export function categoryHueOf(name: string): CategoryHue {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  /* The remainder always indexes the list; the fallback only satisfies the index type. */
  return CATEGORY_HUES[hash % CATEGORY_HUES.length] ?? 'ocean';
}

/** The hue a disc draws, or null for the flat accent: a disc with no initials keeps the accent. */
export function avatarCategory(hue: AvatarHue, name: string): CategoryHue | null {
  if (hue === 'accent') return null;
  if (hue !== 'auto') return hue;
  return initialsOf(name) === '' ? null : categoryHueOf(name);
}

export interface HueTint {
  /** The wash behind the words. */
  bg: ThemeColor;
  /** The words, and a glyph drawn in them. */
  fg: ThemeColor;
}

const TINT: Readonly<Record<CategoryHue, HueTint>> = {
  ocean: { bg: colors['hue-ocean-bg'], fg: colors['hue-ocean-text'] },
  teal: { bg: colors['hue-teal-bg'], fg: colors['hue-teal-text'] },
  plum: { bg: colors['hue-plum-bg'], fg: colors['hue-plum-text'] },
};

/** The wash and words for one of the three hues. */
export function hueTintOf(hue: CategoryHue): HueTint {
  return TINT[hue];
}

/** The wash and words for a hue (`ocean` | `teal` | `plum`), or null. Badge uses it too. */
export function hueTint(hue: string): HueTint | null {
  return isCategoryHue(hue) ? hueTintOf(hue) : null;
}
