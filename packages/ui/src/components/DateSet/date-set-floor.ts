import type {
  ComplianceFloorSpec,
  ComplianceFloorWords,
} from '../ComplianceFloor/ComplianceFloor.types';
import type { DateSetEntry, DateSetWords } from './DateSet.types';

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
  words: DateSetWords,
  floorWords: ComplianceFloorWords,
): ComplianceFloorSpec {
  if (given !== undefined) {
    return given;
  }
  return {
    floor: words.floorName,
    authority: words.narrowerOnly(packName),
    subject: entry?.name === undefined ? words.anyHoliday : words.namedHoliday(entry.name),
    act: 'removed',
    words: floorWords,
  };
}
