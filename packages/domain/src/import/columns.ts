import { type PerLanguage, UI_LANGUAGES } from '../format/languages';
import type { ImportMapping } from './mapping';
import { HEADER_ROW_SCAN, type ImportSheet } from './sheet';
import { importTextKey } from './text';

/**
 * The guess that places a sheet's headers on an import's fields in any launch language (§M01.4
 * localisation notes, `M02-18`). The header words are matching data no surface renders, so each
 * import keeps its own list beside its fields and never in `packages/i18n`; the file's own header
 * text is data and is handed back untouched.
 */

/**
 * The header words one field answers to, per language. English is required; another language lists
 * its own words where a sheet in it writes them. A word belongs to one field only, and a word that
 * could name two names none: the person places that column.
 */
export type HeaderWords = PerLanguage<readonly string[]>;

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

/**
 * A header's comparable form: its text key with any trailing unit words dropped, so `Rate (₹)`,
 * `RATE` and `rate inr` all read `rate`.
 */
export function columnKey(header: string): string {
  const words = importTextKey(header).split(' ');
  while (words.length > 1 && UNIT_WORDS.has(words[words.length - 1] ?? '')) words.pop();
  return words.join(' ');
}

/** One column of the sheet: its header exactly as the file wrote it, and the field guessed. */
export interface ImportColumnGuess<Field extends string> {
  readonly header: string;
  readonly field: Field | null;
}

/** One import's guesses, built once from its fields and their header words. */
export interface ImportColumnGuesser<Field extends string> {
  /**
   * Each header placed on the field its words name, or on none. A field is placed once — the first
   * column naming it wins and a later one is left for the person to place — so two columns never
   * fight over one value.
   */
  readonly guessColumns: (headers: readonly string[]) => readonly ImportColumnGuess<Field>[];
  /**
   * The row whose cells name the most fields, among the first `HEADER_ROW_SCAN`; the earliest wins
   * a tie, and a sheet whose top names no field starts at its first row.
   */
  readonly guessHeaderRow: (rows: readonly (readonly string[])[]) => number;
  /** The columns guessed from one header row of one sheet. */
  readonly mappingForHeader: (
    sheets: readonly ImportSheet[],
    sheet: number,
    headerRow: number,
  ) => ImportMapping<Field>;
  /**
   * What the device proposes once a file is read: the first sheet whose top names a field ("We read
   * the one with a header row"), else the first sheet; its best header row; and its columns.
   */
  readonly guessMapping: (sheets: readonly ImportSheet[]) => ImportMapping<Field> | null;
}

/** One sheet's header row as cells, one per column the sheet fills. */
function headerCells(sheet: ImportSheet, headerRow: number): readonly string[] {
  const row = sheet.topRows[headerRow] ?? [];
  return Array.from({ length: sheet.columnCount }, (_, column) => row[column] ?? '');
}

export function importColumnGuesser<Field extends string>(
  fields: readonly Field[],
  words: Readonly<Record<Field, HeaderWords>>,
): ImportColumnGuesser<Field> {
  const fieldByKey: ReadonlyMap<string, Field> = new Map(
    fields.flatMap((field) =>
      UI_LANGUAGES.flatMap((language) => words[field][language] ?? []).map(
        (word) => [columnKey(word), field] as const,
      ),
    ),
  );

  const guessColumns = (headers: readonly string[]): readonly ImportColumnGuess<Field>[] => {
    const placed = new Set<Field>();
    return headers.map((header) => {
      const field = fieldByKey.get(columnKey(header)) ?? null;
      if (field === null || placed.has(field)) return { header, field: null };
      placed.add(field);
      return { header, field };
    });
  };

  const guessHeaderRow = (rows: readonly (readonly string[])[]): number => {
    let best = { row: 0, placed: 0 };
    rows.slice(0, HEADER_ROW_SCAN).forEach((cells, row) => {
      const placed = guessColumns(cells).filter((guess) => guess.field !== null).length;
      if (placed > best.placed) best = { row, placed };
    });
    return best.row;
  };

  const mappingForHeader = (
    sheets: readonly ImportSheet[],
    sheet: number,
    headerRow: number,
  ): ImportMapping<Field> => {
    const read = sheets[sheet];
    const cells = read === undefined ? [] : headerCells(read, headerRow);
    return { sheet, headerRow, columns: guessColumns(cells).map((guess) => guess.field) };
  };

  const guessMapping = (sheets: readonly ImportSheet[]): ImportMapping<Field> | null => {
    if (sheets.length === 0) return null;
    const guesses = sheets.map((sheet, index) =>
      mappingForHeader(sheets, index, guessHeaderRow(sheet.topRows)),
    );
    const named = guesses.find((guess) => guess.columns.some((field) => field !== null));
    return named ?? guesses[0] ?? null;
  };

  return { guessColumns, guessHeaderRow, mappingForHeader, guessMapping };
}
