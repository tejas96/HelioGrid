import type { Translator } from '../runtime';
import { factsLine } from './proposal-screens-words';

/** The document reader's summary line (`SCR-M06-17`): who it is for, its size and its year. */
const DOCUMENT_HEAD = {
  kw: /*i18n*/ { id: '{size} kW' },
  yearlyKwh: /*i18n*/ { id: '{energy} kWh a year' },
} as const;

/**
 * "Anil Sharma · 3 kW · 4,404 kWh a year" — the line under the document's title on both twins,
 * each part only where the document holds it; the year's energy is shown in whole kWh.
 */
export function proposalDocumentSummary(
  t: Translator['t'],
  format: { readonly number: (value: number) => string },
  facts: {
    readonly customerName: string | null;
    readonly capacityKw: number | null;
    readonly yearlyKwh: number | null;
  },
) {
  return factsLine([
    facts.customerName,
    facts.capacityKw === null
      ? null
      : t(DOCUMENT_HEAD.kw, { size: format.number(facts.capacityKw) }),
    facts.yearlyKwh === null
      ? null
      : t(DOCUMENT_HEAD.yearlyKwh, { energy: format.number(Math.round(facts.yearlyKwh)) }),
  ]);
}
