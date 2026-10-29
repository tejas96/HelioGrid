import { clampCount } from '../../utils/count';
import type { CountBadgeProps } from './AppShell.types';

/** A badge draws for a count above zero, or for `true` — a bare dot; zero and no count draw nothing. */
export function isBadgeDrawn(count: CountBadgeProps['count']): boolean {
  const n = typeof count === 'number' ? count : null;
  if (n !== null && n <= 0) {
    return false;
  }
  return n !== null || count === true;
}

/** The badge's digits — "99+" over `max` — or `null` for the bare dot a `true` count draws. */
export function badgeDigits(count: CountBadgeProps['count'], max: number): string | null {
  return typeof count === 'number' ? clampCount(count, max) : null;
}
