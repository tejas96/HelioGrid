import { moneySymbol } from '../format/money';
import type { FormatPack } from '../format/pack';
import { minorUnitsOfDecimal, minorUnitsToDecimal } from '../money/minor-units';
import type { CatalogImportAttentionReason } from './import';
import { asciiDigits, importTextKey, isBlank } from './import-text';
import { type CatalogSpec, parseCatalogSpec, SPEC_FIELDS, type SpecField } from './specs';
import type { BatteryChemistry, ComponentKind, PanelTechnology } from './vocabulary';

/**
 * How the import reads one cell of a supplier's spreadsheet (`M01-41`): loose text in, a typed
 * value or a refusal out. Nothing here guesses past what the text says — a cell it cannot read is
 * a row that needs attention, never a value made up.
 */

/** A number as a sheet writes it: grouped with commas, Devanagari digits, a unit after it. */
export function readImportNumber(cell: string): number | null {
  const compact = asciiDigits(cell).toLowerCase().replace(/[,\s]/g, '');
  const number = /^(-?\d+(?:\.\d+)?)[a-z%]*$/.exec(compact)?.[1];
  return number === undefined ? null : Number(number);
}

/** `catalog_rate_entry.rate_amount` is `numeric(14,3)`: eleven whole digits. */
const PRICE_WHOLE_DIGITS = 11;

/** Grouped one way or the other, never a mix: `132,000` Western, `1,32,000` Indian. */
const GROUPED_WHOLE = /^(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3}|\d+)$/;

/**
 * The tenant's one currency as its market pack writes it (`F1-07`): the price cells are judged
 * against this and no other.
 */
export type ImportCurrency = Pick<
  FormatPack,
  'locale' | 'currency' | 'currencySymbol' | 'minorUnitDigits'
>;

export type ImportPrice =
  | { readonly ok: true; readonly amount: string }
  | { readonly ok: false; readonly reason: CatalogImportAttentionReason };

/** The text with a mark taken off its start or its end — never out of its middle. */
function withoutEdgeMark(text: string, mark: string): string {
  if (text.startsWith(mark)) return text.slice(mark.length).trim();
  if (text.endsWith(mark)) return text.slice(0, -mark.length).trim();
  return text;
}

/**
 * A cell's figure with the tenant's own currency sign and ISO code taken off its ends. Any other
 * sign, or one inside the figure, stays and makes the cell unreadable: a figure in another
 * currency is never read as the tenant's.
 */
function bareFigure(cell: string, currency: ImportCurrency): string {
  const own = [moneySymbol(currency), currency.currency].map((mark) => mark.toUpperCase());
  return own.reduce(withoutEdgeMark, asciiDigits(cell).toUpperCase().trim()).replace(/\s/g, '');
}

/**
 * A price cell as decimal text at the currency's scale — `₹ 1,32,000` reads `132000.00` for INR.
 * Grouping is Indian or Western; a fraction finer than the minor unit is refused by the money
 * rule (`minorUnitsOfDecimal`), never rounded, because rounding a supplier's price is changing it.
 * A market's informal marks — India's `Rs.` and `/-` — are not read: such a cell is fixed in place.
 */
export function readImportPrice(cell: string | undefined, currency: ImportCurrency): ImportPrice {
  if (isBlank(cell)) return { ok: false, reason: 'price_missing' };
  const parts = /^(-?)([\d,]+)(?:\.(\d+))?$/.exec(bareFigure(cell, currency));
  if (parts === null) return { ok: false, reason: 'price_unreadable' };
  const [, sign, grouped = '', fraction] = parts;
  if (!GROUPED_WHOLE.test(grouped)) return { ok: false, reason: 'price_unreadable' };
  if (sign === '-') return { ok: false, reason: 'price_below_zero' };
  const whole = grouped.replace(/,/g, '').replace(/^0+(?=\d)/, '');
  if (whole.length > PRICE_WHOLE_DIGITS) return { ok: false, reason: 'price_unreadable' };
  const digits = currency.minorUnitDigits;
  try {
    const amount = minorUnitsOfDecimal(
      fraction === undefined ? whole : `${whole}.${fraction}`,
      digits,
    );
    return { ok: true, amount: minorUnitsToDecimal(amount, digits) };
  } catch (error) {
    // The grouping and the whole-digit cap above leave the scale as the only way it can refuse.
    if (error instanceof RangeError) return { ok: false, reason: 'price_finer_than_minor_unit' };
    throw error;
  }
}

/**
 * The words a sheet uses for a closed-set value, keyed by the value. Typed by the sets themselves,
 * so a member added to a set fails to compile here until it has its words.
 */
const VALUE_WORDS: Readonly<
  Record<ComponentKind | PanelTechnology | BatteryChemistry | '1' | '3', readonly string[]>
> = {
  panel: [
    'panel',
    'solar panel',
    'module',
    'solar module',
    'pv module',
    'पैनल',
    'सोलर पैनल',
    'मॉड्यूल',
    'पॅनेल',
    'सोलर पॅनेल',
  ],
  inverter: ['inverter', 'solar inverter', 'इन्वर्टर', 'इनवर्टर', 'इन्व्हर्टर'],
  battery: ['battery', 'बैटरी', 'बॅटरी'],
  micro_inverter: ['micro inverter', 'microinverter', 'माइक्रो इन्वर्टर', 'मायक्रो इन्व्हर्टर'],
  optimiser: ['optimiser', 'optimizer'],
  mono_perc: ['mono perc', 'monoperc', 'perc', 'mono', 'monocrystalline'],
  topcon: ['topcon', 'n type topcon'],
  bifacial: ['bifacial'],
  poly: ['poly', 'polycrystalline', 'multi'],
  hjt: ['hjt', 'heterojunction'],
  lfp: ['lfp', 'lifepo4', 'lithium iron phosphate'],
  nmc: ['nmc'],
  lead_acid: ['lead acid', 'vrla', 'tubular'],
  '1': ['1', 'single', 'single phase', '1 phase', '1ph'],
  '3': ['3', 'three', 'three phase', '3 phase', '3ph'],
};

function wordsFor(value: string | number): readonly string[] {
  const words: Readonly<Record<string, readonly string[]>> = VALUE_WORDS;
  return [value, ...(words[String(value)] ?? [])].map((word) => importTextKey(String(word)));
}

function readClosedSet<T extends string | number>(cell: string, values: readonly T[]): T | null {
  const key = importTextKey(cell);
  return values.find((value) => wordsFor(value).includes(key)) ?? null;
}

export function readComponentKind(
  cell: string | undefined,
  kinds: readonly ComponentKind[],
): ComponentKind | null {
  return isBlank(cell) ? null : readClosedSet(cell, kinds);
}

/** A spec cell as its field's type, or the text itself so the envelope's gate refuses it. */
export function readSpecValue(field: SpecField, cell: string): unknown {
  if (field.values !== null) return readClosedSet(cell, field.values) ?? cell;
  return readImportNumber(cell) ?? cell;
}

export function specValueAt(spec: CatalogSpec, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || typeof value !== 'object') return undefined;
    return Object.entries(value).find(([name]) => name === key)?.[1];
  }, spec);
}

/** Whether a field path is the path asked about, or inside it, and its cell holds something. */
function isFilledUnder(
  fieldPath: string,
  path: string,
  cells: Readonly<Partial<Record<string, string>>>,
): boolean {
  return (fieldPath === path || fieldPath.startsWith(`${path}.`)) && !isBlank(cells[fieldPath]);
}

export type ImportSpec =
  | { readonly ok: true; readonly spec: CatalogSpec }
  | {
      readonly ok: false;
      readonly missing: readonly string[];
      readonly invalid: readonly string[];
    };

/** A kind's whole envelope from a row's cells, held by the same gates as the single form. */
export function readImportSpec(
  kind: ComponentKind,
  cells: Readonly<Partial<Record<string, string>>>,
): ImportSpec {
  const raw: Record<string, unknown> = { kind };
  for (const field of SPEC_FIELDS[kind]) {
    const cell = cells[field.path];
    if (isBlank(cell)) continue;
    const [parent, child] = field.path.split('.');
    if (parent === undefined) continue;
    if (child === undefined) {
      raw[parent] = readSpecValue(field, cell);
    } else {
      const nested = raw[parent];
      raw[parent] = {
        ...(typeof nested === 'object' && nested !== null ? nested : {}),
        [child]: readSpecValue(field, cell),
      };
    }
  }
  const parsed = parseCatalogSpec(raw);
  if (parsed.ok) return parsed;
  const blank = (path: string) =>
    !SPEC_FIELDS[kind].some((field) => isFilledUnder(field.path, path, cells));
  return {
    ok: false,
    missing: parsed.failedFields.filter(blank),
    invalid: parsed.failedFields.filter((path) => !blank(path)),
  };
}
