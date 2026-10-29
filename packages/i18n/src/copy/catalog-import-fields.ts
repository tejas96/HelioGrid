import type { TranslatedText } from '@heliogrid/contracts';
import type { CatalogImportField } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/**
 * The fields a price list's column can fill (`SCR-M01-17` step 2): the product's vocabulary, which
 * translates, beside the file's own headers, which never do (brief decision 4). Keyed by domain's
 * field list, so a field added there does not compile here until it has its words.
 */
const FIELD: Record<CatalogImportField, { id: string }> = {
  kind: /*i18n*/ { id: 'Kind' },
  brand: /*i18n*/ { id: 'Brand' },
  model: /*i18n*/ { id: 'Model / SKU' },
  rate: /*i18n*/ { id: 'Price per unit' },
  watt: /*i18n*/ { id: 'Peak power (Wp)' },
  technology: /*i18n*/ { id: 'Cell technology' },
  lengthMm: /*i18n*/ { id: 'Length (mm)' },
  widthMm: /*i18n*/ { id: 'Width (mm)' },
  vocV: /*i18n*/ { id: 'Open-circuit voltage (V)' },
  vmpV: /*i18n*/ { id: 'Voltage at max power (V)' },
  iscA: /*i18n*/ { id: 'Short-circuit current (A)' },
  impA: /*i18n*/ { id: 'Current at max power (A)' },
  tempCoeffVocPct: /*i18n*/ { id: 'Voltage temperature coefficient (%/°C)' },
  tempCoeffPmaxPct: /*i18n*/ { id: 'Power temperature coefficient (%/°C)' },
  bifacialityPct: /*i18n*/ { id: 'Bifaciality (%)' },
  warrantyYears: /*i18n*/ { id: 'Warranty (years)' },
  weightKg: /*i18n*/ { id: 'Weight (kg)' },
  acKw: /*i18n*/ { id: 'AC output (kW)' },
  phases: /*i18n*/ { id: 'Phases' },
  'mppt.count': /*i18n*/ { id: 'MPPT count' },
  'mppt.minV': /*i18n*/ { id: 'MPPT lowest voltage (V)' },
  'mppt.maxV': /*i18n*/ { id: 'MPPT highest voltage (V)' },
  'mppt.maxCurrentA': /*i18n*/ { id: 'MPPT highest current (A)' },
  'mppt.stringsPerMppt': /*i18n*/ { id: 'Strings per MPPT' },
  maxDcV: /*i18n*/ { id: 'Highest DC voltage (V)' },
  efficiencyPct: /*i18n*/ { id: 'Efficiency (%)' },
  usableKwh: /*i18n*/ { id: 'Usable energy (kWh)' },
  nominalV: /*i18n*/ { id: 'Nominal voltage (V)' },
  chemistry: /*i18n*/ { id: 'Battery chemistry' },
  powerKw: /*i18n*/ { id: 'Continuous power (kW)' },
  cycleLife: /*i18n*/ { id: 'Cycle life' },
  depthMm: /*i18n*/ { id: 'Depth (mm)' },
  heightMm: /*i18n*/ { id: 'Height (mm)' },
  ratedAcW: /*i18n*/ { id: 'Rated AC output (W)' },
  ratedInputW: /*i18n*/ { id: 'Rated input (W)' },
};

export function catalogImportFields(
  t: Translator['t'],
): Record<CatalogImportField, TranslatedText> {
  const entries = Object.entries(FIELD) as [CatalogImportField, { id: string }][];
  return Object.fromEntries(entries.map(([field, word]) => [field, t(word)])) as Record<
    CatalogImportField,
    TranslatedText
  >;
}
