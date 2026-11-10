import { type ImportCurrency, readImportPrice } from '../catalog/import-cells';
import type { PerLanguage } from '../format/languages';
import { UI_LANGUAGES } from '../format/languages';
import type { FormatPack } from '../format/pack';
import { phoneE164Of } from '../format/phone';
import { importTextKey, isBlank } from '../import/text';
import { type MinorUnits, minorUnitsOfDecimal } from '../money/minor-units';
import type { DealSegment } from '../tenancy/segment';
import type { LeadImportCells, LeadImportMappedRow } from './lead-import-fields';

/**
 * How the lead import reads one row of an old spreadsheet (`M02-19`…`M02-21`): its number read the
 * market's way — the identity every duplicate is found by (`M02-02`) — and the lead it would land
 * as, or every reason it cannot land. Nothing is guessed past what a cell says: a cell the import
 * cannot read rejects the row, and the report names why.
 */

/**
 * Why a row cannot land (`M02-21`): a number that does not read as one, no number at all, a cell
 * the import cannot read (a bill that is no amount, a type that is no segment), or a row the run
 * could not write — its own write failed, or the run ended first.
 */
export const LEAD_IMPORT_PROBLEMS = [
  'unreadable_number',
  'missing_number',
  'malformed_row',
  'not_written',
] as const;
export type LeadImportProblem = (typeof LEAD_IMPORT_PROBLEMS)[number];

/** What a landable row creates: the customer's name and city, and the lead's segment and bill. */
export interface ImportedLead {
  readonly name: string | null;
  readonly city: string | null;
  readonly segment: DealSegment | null;
  /** The tenant currency's minor unit (`F1-07`); null where the row names no bill. */
  readonly monthlyBill: MinorUnits | null;
}

export type LeadImportRowRead =
  | { readonly landable: true; readonly phoneE164: string; readonly lead: ImportedLead }
  | {
      readonly landable: false;
      readonly phoneE164: string | null;
      readonly problems: readonly LeadImportProblem[];
    };

/**
 * The words a sheet writes a segment in, per language. Matching data no surface renders, so it
 * sits beside the reader and never in `packages/i18n`; a word names one segment only.
 */
const SEGMENT_WORDS: Readonly<Record<DealSegment, PerLanguage<readonly string[]>>> = {
  residential: {
    en: ['residential', 'residence', 'home', 'house', 'household', 'domestic', 'resi'],
    hi: ['आवासीय', 'घरेलू', 'घर'],
    mr: ['निवासी', 'घरगुती', 'घर'],
  },
  commercial: {
    en: [
      'commercial',
      'business',
      'shop',
      'office',
      'industrial',
      'industry',
      'factory',
      'c&i',
      'commercial and industrial',
      'commercial & industrial',
    ],
    hi: ['वाणिज्यिक', 'व्यावसायिक', 'व्यापारिक', 'दुकान', 'औद्योगिक'],
    mr: ['व्यावसायिक', 'दुकान', 'औद्योगिक', 'कारखाना'],
  },
};

const SEGMENT_BY_KEY: ReadonlyMap<string, DealSegment> = new Map(
  (Object.keys(SEGMENT_WORDS) as DealSegment[]).flatMap((segment) =>
    UI_LANGUAGES.flatMap((language) => SEGMENT_WORDS[segment][language] ?? []).map(
      (word) => [importTextKey(word), segment] as const,
    ),
  ),
);

/** A blank cell is absent; any other is read as written, without its outer spaces. */
function textOf(cell: string | undefined): string | null {
  return isBlank(cell) ? null : cell.trim();
}

type CellRead<T> = { readonly read: true; readonly value: T | null } | { readonly read: false };

function segmentOf(cell: string | undefined): CellRead<DealSegment> {
  if (isBlank(cell)) return { read: true, value: null };
  const segment = SEGMENT_BY_KEY.get(importTextKey(cell));
  return segment === undefined ? { read: false } : { read: true, value: segment };
}

/** A bill as the catalog import reads a price — the tenant's own currency, grouped either way. */
function billOf(cell: string | undefined, currency: ImportCurrency): CellRead<MinorUnits> {
  if (isBlank(cell)) return { read: true, value: null };
  const price = readImportPrice(cell, currency);
  if (!price.ok) return { read: false };
  return { read: true, value: minorUnitsOfDecimal(price.amount, currency.minorUnitDigits) };
}

/** One row read: the lead it lands as, or every reason it cannot — the number's first. */
export function readLeadImportRow(cells: LeadImportCells, formats: FormatPack): LeadImportRowRead {
  const phoneE164 = isBlank(cells.phone) ? null : phoneE164Of(formats, cells.phone);
  const segment = segmentOf(cells.segment);
  const bill = billOf(cells.monthly_bill, formats);
  const problems: LeadImportProblem[] = [];
  if (isBlank(cells.phone)) problems.push('missing_number');
  else if (phoneE164 === null) problems.push('unreadable_number');
  if (!segment.read || !bill.read) problems.push('malformed_row');
  if (phoneE164 === null || !segment.read || !bill.read) {
    return { landable: false, phoneE164, problems };
  }
  return {
    landable: true,
    phoneE164,
    lead: {
      name: textOf(cells.name),
      city: textOf(cells.city),
      segment: segment.value,
      monthlyBill: bill.value,
    },
  };
}

/** One row as the preview pass judges it, before any number is matched against the company. */
export interface JudgedLeadImportRow {
  readonly rowNumber: number;
  readonly cells: LeadImportCells;
  readonly phoneE164: string | null;
  readonly problems: readonly LeadImportProblem[];
  /** The earlier landable row of the file with this number, which lands first (RFC decision 16). */
  readonly repeatsRow: number | null;
}

/**
 * Every mapped row judged in sheet order. A landable row repeating an earlier landable row's number
 * names that row, and follows the duplicate choice once the first has landed; a rejected row lands
 * nothing, so a later row with its number is judged on its own.
 */
export function judgeLeadImportRows(
  rows: readonly LeadImportMappedRow[],
  formats: FormatPack,
): JudgedLeadImportRow[] {
  const firstWith = new Map<string, number>();
  return rows.map(({ rowNumber, cells }) => {
    const read = readLeadImportRow(cells, formats);
    if (!read.landable) {
      return {
        rowNumber,
        cells,
        phoneE164: read.phoneE164,
        problems: read.problems,
        repeatsRow: null,
      };
    }
    const repeatsRow = firstWith.get(read.phoneE164) ?? null;
    if (repeatsRow === null) firstWith.set(read.phoneE164, rowNumber);
    return { rowNumber, cells, phoneE164: read.phoneE164, problems: [], repeatsRow };
  });
}
