import { UI_LANGUAGES, type UiLanguage } from '../format/languages';
import { importTextKey } from './import-text';

/**
 * The columns an import can fill (`M01-41`), and the guess that places a sheet's headers on them in
 * any launch language (§M01.4 localisation notes). The header words are matching data no surface
 * renders, so they live here and never in `packages/i18n`; the file's own header text is data and
 * is handed back untouched.
 */

/**
 * The item's identity and price, then every field a kind's spec envelope declares (`specs.ts`), by
 * its dotted path. `import-columns.test.ts` holds this list to the envelopes, so a spec field the
 * import cannot fill is a red test, not a new product that can never be created.
 */
export const CATALOG_IMPORT_FIELDS = [
  'kind',
  'brand',
  'model',
  'rate',
  'watt',
  'technology',
  'lengthMm',
  'widthMm',
  'vocV',
  'vmpV',
  'iscA',
  'impA',
  'tempCoeffVocPct',
  'tempCoeffPmaxPct',
  'bifacialityPct',
  'warrantyYears',
  'weightKg',
  'acKw',
  'phases',
  'mppt.count',
  'mppt.minV',
  'mppt.maxV',
  'mppt.maxCurrentA',
  'mppt.stringsPerMppt',
  'maxDcV',
  'efficiencyPct',
  'usableKwh',
  'nominalV',
  'chemistry',
  'powerKw',
  'cycleLife',
  'depthMm',
  'heightMm',
  'ratedAcW',
  'ratedInputW',
] as const;
export type CatalogImportField = (typeof CATALOG_IMPORT_FIELDS)[number];

/**
 * The header words each field answers to, per launch language. Keyed by `UiLanguage`, so a language
 * added to `UI_LANGUAGES` does not compile here until every field says which words it answers to
 * in it — an empty list where a sheet in that language writes the English term (`Voc`, `MPPT`).
 * Compared through `importTextKey` with a trailing unit dropped, so `Rate (₹)`, `RATE` and
 * `rate inr` all read `rate`. A word belongs to one field only, and a word that could name two —
 * `type`, `company`, `cost` — names none: the person places that column.
 */
type HeaderWords = Readonly<Record<UiLanguage, readonly string[]>>;

const ENGLISH_ONLY = (...en: string[]): HeaderWords => ({ en, hi: [], mr: [] });

export const HEADER_WORDS: Readonly<Record<CatalogImportField, HeaderWords>> = {
  kind: {
    en: ['kind', 'category', 'product type', 'item type', 'component'],
    hi: ['प्रकार', 'श्रेणी'],
    mr: ['प्रकार', 'वर्ग'],
  },
  brand: {
    en: ['brand', 'make', 'manufacturer'],
    hi: ['ब्रांड', 'निर्माता'],
    mr: ['ब्रँड', 'उत्पादक'],
  },
  model: {
    en: ['model', 'model no', 'model number', 'model name'],
    hi: ['मॉडल', 'मॉडल नंबर', 'मॉडल संख्या', 'मॉडल क्रमांक'],
    mr: ['मॉडेल', 'मॉडेल नंबर', 'मॉडेल क्रमांक'],
  },
  rate: {
    en: ['rate', 'price', 'unit price', 'rate per unit', 'price per unit', 'dealer price'],
    hi: ['दर', 'रेट', 'कीमत', 'मूल्य', 'दाम'],
    mr: ['दर', 'रेट', 'किंमत', 'मूल्य'],
  },
  watt: {
    en: ['watt', 'watts', 'wattage', 'wp', 'pmax', 'module power'],
    hi: ['वॉट', 'वाट', 'वॉटेज'],
    mr: ['वॅट', 'वॅटेज'],
  },
  technology: {
    en: ['technology', 'cell type', 'cell technology'],
    hi: ['तकनीक'],
    mr: ['तंत्रज्ञान'],
  },
  lengthMm: { en: ['length'], hi: ['लंबाई'], mr: ['लांबी'] },
  widthMm: { en: ['width'], hi: ['चौड़ाई'], mr: ['रुंदी'] },
  vocV: ENGLISH_ONLY('voc', 'open circuit voltage'),
  vmpV: ENGLISH_ONLY('vmp', 'vmpp', 'maximum power voltage'),
  iscA: ENGLISH_ONLY('isc', 'short circuit current'),
  impA: ENGLISH_ONLY('imp', 'impp', 'maximum power current'),
  tempCoeffVocPct: ENGLISH_ONLY(
    'temp coeff voc',
    'temperature coefficient voc',
    'temperature coefficient of voc',
  ),
  tempCoeffPmaxPct: ENGLISH_ONLY(
    'temp coeff pmax',
    'temperature coefficient pmax',
    'temperature coefficient of pmax',
  ),
  bifacialityPct: ENGLISH_ONLY('bifaciality', 'bifacial factor'),
  warrantyYears: { en: ['warranty'], hi: ['वारंटी', 'वॉरंटी'], mr: ['हमी'] },
  weightKg: { en: ['weight'], hi: ['वजन'], mr: ['वजन'] },
  acKw: ENGLISH_ONLY('ac power', 'rated ac power', 'ac output', 'output power'),
  phases: { en: ['phase', 'phases'], hi: ['फेज'], mr: ['फेज'] },
  'mppt.count': ENGLISH_ONLY('mppt', 'mppts', 'mppt count', 'no of mppt', 'number of mppt'),
  'mppt.minV': ENGLISH_ONLY('mppt min voltage', 'min mppt voltage', 'mppt voltage min'),
  'mppt.maxV': ENGLISH_ONLY('mppt max voltage', 'max mppt voltage', 'mppt voltage max'),
  'mppt.maxCurrentA': ENGLISH_ONLY('max input current', 'mppt max current', 'max current per mppt'),
  'mppt.stringsPerMppt': ENGLISH_ONLY('strings per mppt'),
  maxDcV: ENGLISH_ONLY('max dc voltage', 'maximum dc voltage', 'max input voltage'),
  efficiencyPct: { en: ['efficiency', 'max efficiency'], hi: ['दक्षता'], mr: ['कार्यक्षमता'] },
  usableKwh: ENGLISH_ONLY('usable energy', 'usable capacity', 'usable kwh'),
  nominalV: ENGLISH_ONLY('nominal voltage'),
  chemistry: ENGLISH_ONLY('chemistry', 'battery type'),
  powerKw: ENGLISH_ONLY('continuous power', 'battery power'),
  cycleLife: ENGLISH_ONLY('cycle life', 'cycles'),
  depthMm: { en: ['depth'], hi: ['गहराई'], mr: ['खोली'] },
  heightMm: { en: ['height'], hi: ['ऊंचाई', 'ऊँचाई'], mr: ['उंची'] },
  ratedAcW: ENGLISH_ONLY('rated ac w', 'micro inverter power'),
  ratedInputW: ENGLISH_ONLY('rated input', 'input power'),
};

/** A unit written after a header's name — `Length mm`, `Price INR` — is not part of its name. */
const UNIT_WORDS: ReadonlySet<string> = new Set([
  'mm',
  'cm',
  'kg',
  'v',
  'a',
  'w',
  'wp',
  'kw',
  'kwp',
  'kwh',
  'pct',
  'percent',
  'year',
  'years',
  'yrs',
  'rs',
  'inr',
  'वर्ष',
  'रुपये',
]);

/** A header's comparable form: its text key with any trailing unit words dropped. */
export function columnKey(header: string): string {
  const words = importTextKey(header).split(' ');
  while (words.length > 1 && UNIT_WORDS.has(words[words.length - 1] ?? '')) words.pop();
  return words.join(' ');
}

const FIELD_BY_KEY: ReadonlyMap<string, CatalogImportField> = new Map(
  CATALOG_IMPORT_FIELDS.flatMap((field) =>
    UI_LANGUAGES.flatMap((language) => HEADER_WORDS[field][language]).map(
      (word) => [columnKey(word), field] as const,
    ),
  ),
);

/** One column of the sheet: its header exactly as the file wrote it, and the field guessed. */
export interface ColumnGuess {
  readonly header: string;
  readonly field: CatalogImportField | null;
}

/**
 * Each header placed on the field its words name, or on none. A field is placed once — the first
 * column naming it wins and a later one is left for the person to place — so two columns never
 * fight over one value.
 */
export function guessColumns(headers: readonly string[]): readonly ColumnGuess[] {
  const placed = new Set<CatalogImportField>();
  return headers.map((header) => {
    const field = FIELD_BY_KEY.get(columnKey(header)) ?? null;
    if (field === null || placed.has(field)) return { header, field: null };
    placed.add(field);
    return { header, field };
  });
}

/** A header row sits near the top: a supplier's title block runs a few lines, never a page. */
export const HEADER_ROW_SCAN = 10;

/**
 * The row whose cells name the most fields, among the first `HEADER_ROW_SCAN`; the earliest wins a
 * tie, and a sheet whose top names no field starts at its first row.
 */
export function guessHeaderRow(rows: readonly (readonly string[])[]): number {
  let best = { row: 0, placed: 0 };
  rows.slice(0, HEADER_ROW_SCAN).forEach((cells, row) => {
    const placed = guessColumns(cells).filter((guess) => guess.field !== null).length;
    if (placed > best.placed) best = { row, placed };
  });
  return best.row;
}
