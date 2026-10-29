import type { TranslatedText } from '@heliogrid/contracts';
import type { ItemFieldFailure } from '@heliogrid/domain';
import type { Translator } from '../runtime';

type T = Translator['t'];

/** A spec field's label, by its dotted path; its unit is a symbol, never translated (`CLAUDE.md` §9). */
const FIELD: Record<string, { id: string }> = {
  watt: /*i18n*/ { id: 'Rated power' },
  technology: /*i18n*/ { id: 'Cell technology' },
  lengthMm: /*i18n*/ { id: 'Length' },
  widthMm: /*i18n*/ { id: 'Width' },
  depthMm: /*i18n*/ { id: 'Depth' },
  heightMm: /*i18n*/ { id: 'Height' },
  vocV: /*i18n*/ { id: 'Voc' },
  vmpV: /*i18n*/ { id: 'Vmp' },
  iscA: /*i18n*/ { id: 'Isc' },
  impA: /*i18n*/ { id: 'Imp' },
  tempCoeffVocPct: /*i18n*/ { id: 'Voc temp. coefficient' },
  tempCoeffPmaxPct: /*i18n*/ { id: 'Pmax temp. coefficient' },
  bifacialityPct: /*i18n*/ { id: 'Bifaciality' },
  warrantyYears: /*i18n*/ { id: 'Warranty' },
  weightKg: /*i18n*/ { id: 'Weight' },
  acKw: /*i18n*/ { id: 'AC power' },
  phases: /*i18n*/ { id: 'Phases' },
  maxDcV: /*i18n*/ { id: 'Max DC voltage' },
  efficiencyPct: /*i18n*/ { id: 'Efficiency' },
  'mppt.count': /*i18n*/ { id: 'MPPT trackers' },
  'mppt.stringsPerMppt': /*i18n*/ { id: 'Strings per MPPT' },
  'mppt.maxCurrentA': /*i18n*/ { id: 'MPPT max current' },
  'mppt.minV': /*i18n*/ { id: 'MPPT low voltage' },
  'mppt.maxV': /*i18n*/ { id: 'MPPT high voltage' },
  usableKwh: /*i18n*/ { id: 'Usable energy' },
  nominalV: /*i18n*/ { id: 'Nominal voltage' },
  chemistry: /*i18n*/ { id: 'Chemistry' },
  powerKw: /*i18n*/ { id: 'Continuous power' },
  cycleLife: /*i18n*/ { id: 'Cycle life' },
  ratedAcW: /*i18n*/ { id: 'Rated AC power' },
  ratedInputW: /*i18n*/ { id: 'Rated input power' },
};

/** A unit that is a word, not a symbol: it reads in the person's language. */
const UNIT_WORD = {
  years: /*i18n*/ { id: 'years' },
  cycles: /*i18n*/ { id: 'cycles' },
} as const;

const PHASES = {
  1: /*i18n*/ { id: 'Single phase' },
  3: /*i18n*/ { id: 'Three phase' },
} as const;

const FAILED = {
  needed: /*i18n*/ { id: 'Needed.' },
  tooLong: /*i18n*/ { id: 'Up to 120 characters.' },
  positive: /*i18n*/ { id: 'Must be more than 0.' },
  belowZero: /*i18n*/ { id: 'Must be below 0.' },
  belowHundred: /*i18n*/ { id: 'Must be below 100.' },
  upToHundred: /*i18n*/ { id: 'Must be more than 0 and at most 100.' },
  whole: /*i18n*/ { id: 'Must be a whole number above 0.' },
  exceeds: /*i18n*/ { id: '{field} must be more than {other}.' },
  atLeast: /*i18n*/ { id: '{field} must be at least {other}.' },
  reference: /*i18n*/ { id: 'Enter the {scheme} list reference, or switch it off.' },
} as const;

const SI_UNIT: Record<string, string> = {
  watt: 'Wp',
  lengthMm: 'mm',
  widthMm: 'mm',
  depthMm: 'mm',
  heightMm: 'mm',
  vocV: 'V',
  vmpV: 'V',
  iscA: 'A',
  impA: 'A',
  tempCoeffVocPct: '%/°C',
  tempCoeffPmaxPct: '%/°C',
  bifacialityPct: '%',
  weightKg: 'kg',
  acKw: 'kW',
  maxDcV: 'V',
  efficiencyPct: '%',
  'mppt.maxCurrentA': 'A',
  'mppt.minV': 'V',
  'mppt.maxV': 'V',
  usableKwh: 'kWh',
  nominalV: 'V',
  powerKw: 'kW',
  ratedAcW: 'W',
  ratedInputW: 'W',
};

/** A spec field's label and unit — a symbol as written, a word in the person's language. */
export interface AddItemFieldWords {
  readonly label: TranslatedText;
  readonly unit: string | null;
}

export function addItemFieldWords(t: T, path: string): AddItemFieldWords {
  const unit =
    path === 'warrantyYears'
      ? t(UNIT_WORD.years)
      : path === 'cycleLife'
        ? t(UNIT_WORD.cycles)
        : (SI_UNIT[path] ?? null);
  return { label: t(FIELD[path] ?? { id: path }), unit };
}

/** The two phase counts an inverter takes, as a choice in a list. */
export const addItemPhaseWords = (t: T) =>
  ([1, 3] as const).map((value) => ({ value: String(value), label: t(PHASES[value]) }));

const POSITIVE_ONE_HUNDRED = new Set(['bifacialityPct']);
const BELOW_ZERO = new Set(['tempCoeffVocPct', 'tempCoeffPmaxPct']);
const BELOW_ONE_HUNDRED = new Set(['efficiencyPct']);
const WHOLE = new Set(['mppt.count', 'mppt.stringsPerMppt', 'cycleLife']);

function invalidWords(t: T, field: string): TranslatedText {
  if (field === 'brand' || field === 'model') return t(FAILED.tooLong);
  if (BELOW_ZERO.has(field)) return t(FAILED.belowZero);
  if (BELOW_ONE_HUNDRED.has(field)) return t(FAILED.belowHundred);
  if (POSITIVE_ONE_HUNDRED.has(field)) return t(FAILED.upToHundred);
  if (WHOLE.has(field)) return t(FAILED.whole);
  return t(FAILED.positive);
}

/** A failed field's words, under the field; `spec.` and `certifications.` are dropped to name it. */
export function catalogItemFailureWords(t: T, failure: ItemFieldFailure): TranslatedText {
  const field = failure.path.replace(/^spec\./, '');
  if (failure.path.startsWith('certifications.')) {
    return t(FAILED.reference, { scheme: failure.path.slice('certifications.'.length) });
  }
  switch (failure.issue) {
    case 'required':
      return t(FAILED.needed);
    case 'invalid':
      return invalidWords(t, field);
    case 'exceeds':
    case 'atLeast':
      return t(FAILED[failure.issue], {
        field: addItemFieldWords(t, field).label,
        other: addItemFieldWords(t, failure.than ?? '').label,
      });
  }
}

/** Every failed field's words, by its body path — what the sheet shows under each field. */
export function catalogItemFailuresOf(
  t: T,
  failures: readonly ItemFieldFailure[],
): Readonly<Record<string, TranslatedText>> {
  return Object.fromEntries(
    failures.map((failure) => [failure.path, catalogItemFailureWords(t, failure)]),
  );
}
