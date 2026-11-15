import type { DealSegment } from '../tenancy/segment';
import { firstNameOf } from '../tenancy/team-acts';

/**
 * What every proposal line calls the customer — a share, a thank-you, a track line, a greeting.
 * A person is called by their short name (`firstNameOf`); a business never is: "Big Crore
 * Industries" cut to "Big" names no one. A deal whose segment is not chosen yet reads as a person.
 */
export function customerShortNameOf(name: string, segment: DealSegment | null): string;
export function customerShortNameOf(
  name: string | null,
  segment: DealSegment | null,
): string | null;
export function customerShortNameOf(
  name: string | null,
  segment: DealSegment | null,
): string | null {
  if (name === null) return null;
  return segment === 'commercial' ? name.trim().split(/\s+/u).join(' ') : firstNameOf(name);
}
