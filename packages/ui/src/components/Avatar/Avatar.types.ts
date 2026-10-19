import type { ReactNode } from 'react';

/**
 * Perfect-circle avatar with an initials fallback, and the overlapping group built from it.
 * The shared contract both platform halves import (docs/engineering/17 §2).
 */

/** The three brand iris hues (design-system change 7): a person's tint, a label's kind. */
export type IrisHue = 'violet' | 'blue' | 'magenta';

/** `auto` picks an iris hue from the name; `accent` is the flat lavender. */
export type AvatarHue = 'auto' | IrisHue | 'accent';

/** A person's standing as a dot — the same four tones the status words beside it take. */
export type AvatarMark = 'info' | 'success' | 'warning' | 'neutral';

export interface AvatarProps {
  src?: string;
  /** used for initials fallback + alt text */
  name?: string;
  size?: 24 | 32 | 40 | 56 | 80 | number;
  /**
   * The brand iris hue behind the initials. `auto` (default) picks violet, blue or magenta from
   * the name, so a person keeps one colour on every screen and on both platforms; `accent` is the
   * flat lavender.
   */
  hue?: AvatarHue;
  /** A thing, not a person: the glyph in `--accent` on a white disc, with no initials and no tint
   *  (`SCR-M01-13`'s capability cluster). */
  glyph?: ReactNode;
  /**
   * The person's standing as a dot at the disc's foot, in a ring of `--canvas` (`SCR-M01-12`). It
   * repeats what the words beside it say — never the only carrier of the state — so it is not read
   * aloud. Drawn for a 40–56px disc.
   */
  mark?: AvatarMark;
}

export interface AvatarGroupProps {
  people?: AvatarProps[];
  size?: number;
  max?: number;
  /**
   * The colour of the ground the group sits on — each disc's 2px ring takes it, so the overlap
   * reads. Defaults to the ground that holds the group. A colour token reference on the web
   * (`var(--canvas)`), the token's value on the phone (`theme.colors.canvas`); never a raw colour.
   */
  ring?: string;
}

/**
 * Initials are words. The scale is floored at 12px — the type floor applies to a 24px avatar
 * exactly as it does to a table cell, and the derived fallback is clamped for custom sizes.
 */
const INITIALS_SIZES: Record<number, number> = { 24: 12, 32: 13, 40: 15, 56: 20, 80: 28 };

/** The initials type size for an avatar diameter. Shared so both halves floor it identically. */
export function initialsSize(size: number): number {
  return INITIALS_SIZES[size] ?? Math.max(12, Math.round(size * 0.38));
}

/** The overflow pill's type size — the same 12px floor, on the group's own ratio. */
export function overflowSize(size: number): number {
  return Math.max(12, Math.round(size * 0.36));
}

/** One shown avatar and the stable key it renders under. */
export interface KeyedAvatar {
  key: string;
  person: AvatarProps;
}

/**
 * The contract carries no id on a person, so the key is the identity the caller DID give — name
 * plus source — with a repeat counter for genuine duplicates. Stable under reordering, which an
 * array index is not.
 */
export function keyedAvatars(people: AvatarProps[]): KeyedAvatar[] {
  const seen = new Map<string, number>();
  return people.map((person) => {
    const base = `${person.name ?? ''}|${person.src ?? ''}`;
    const repeat = seen.get(base) ?? 0;
    seen.set(base, repeat + 1);
    return { key: repeat === 0 ? base : `${base}#${repeat}`, person };
  });
}

/** First letters of the first two words, uppercased. Empty when there is no name. */
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.slice(0, 1))
    .join('')
    .toUpperCase();
}
