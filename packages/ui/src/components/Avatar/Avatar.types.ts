/**
 * Perfect-circle avatar with an initials fallback, and the overlapping group built from it.
 * The shared contract both platform halves import (docs/engineering/17 §2).
 */

export interface AvatarProps {
  src?: string;
  /** used for initials fallback + alt text */
  name?: string;
  size?: 24 | 32 | 40 | 56 | 80 | number;
}

export interface AvatarGroupProps {
  people?: AvatarProps[];
  size?: number;
  max?: number;
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
