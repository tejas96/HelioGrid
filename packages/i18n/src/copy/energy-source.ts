import { type EnergySource, ESTIMATE_TOLERANCE_PERCENT, inLadderOrder } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';

/**
 * The two energy source labels (`F8-08`), fixed copy. The database names and the tolerance are
 * slots, never words a translation may change: a database is a proper name, and the tolerance is
 * the fallback's documented accuracy, read from `packages/domain`.
 */
export const ENERGY_SOURCE_WORD: Record<EnergySource['kind'], MessageRef> = {
  record: /*i18n*/ { id: 'Real · PVGIS ({database})' },
  estimate: /*i18n*/ { id: 'Built-in estimate ±{tolerance}%' },
};

/** Proper names, so one separator in every language. */
const DATABASE_SEPARATOR = ', ';

/** The source label in the reader's language — `translate` is the mount's `t`. */
export function energySourceLabel(translate: Translator['t'], source: EnergySource): string {
  if (source.kind === 'estimate') {
    return translate(ENERGY_SOURCE_WORD.estimate, { tolerance: ESTIMATE_TOLERANCE_PERCENT });
  }
  return translate(ENERGY_SOURCE_WORD.record, {
    database: inLadderOrder(source.databases).join(DATABASE_SEPARATOR),
  });
}
