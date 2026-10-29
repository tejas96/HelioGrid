/**
 * `RangeField`'s words (`packages/ui`'s `boxLabels` and `anyLabel`): the two ends' names, on the
 * boxes and in each thumb's accessible name, and the readout of an untouched pair.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';

export const RANGE_FIELD = {
  from: /*i18n*/ { id: 'From' },
  to: /*i18n*/ { id: 'To' },
  any: /*i18n*/ { id: 'Any' },
} as const;

/** The two ends' names and the untouched readout, named as `RangeField` takes them. */
export function rangeFieldWords(t: Translator['t']): {
  boxLabels: [TranslatedText, TranslatedText];
  anyLabel: TranslatedText;
} {
  return {
    boxLabels: [t(RANGE_FIELD.from), t(RANGE_FIELD.to)],
    anyLabel: t(RANGE_FIELD.any),
  };
}
