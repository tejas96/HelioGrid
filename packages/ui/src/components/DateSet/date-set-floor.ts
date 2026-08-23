import type { ComplianceFloorSpec } from '../ComplianceFloor/ComplianceFloor.types';
import type { DateSetEntry } from './DateSet.types';

/**
 * The floor a pack-supplied date carries, composed when the caller has not written one.
 *
 * `M07-12` permits "narrower windows and extra holidays only, NEVER WIDER", so a pack-supplied
 * holiday is not the tenant's to remove — deleting it widens the calling window past what the
 * market allows. The wording itself belongs to `ComplianceFloor`, which composes the same sentence
 * for every host: what cannot happen, flatly, then WHICH FLOOR, NAMED.
 */
export function floorFor(
  entry: DateSetEntry | undefined,
  packName: string,
  given: ComplianceFloorSpec | undefined,
): ComplianceFloorSpec {
  if (given !== undefined) {
    return given;
  }
  return {
    floor: 'Market calling window',
    authority: `${packName} · narrower only, never wider`,
    subject: entry?.name === undefined ? 'A market holiday' : `“${entry.name}”`,
    act: 'removed',
  };
}

/** The refusal's own second sentence, when the caller has not supplied one. */
export function refusalMessage(packName: string): string {
  return `${packName} supplies this date. The calling window can be narrowed, never widened — so a market holiday is not the tenant's to remove.`;
}
