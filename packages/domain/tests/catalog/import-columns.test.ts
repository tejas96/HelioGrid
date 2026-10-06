import { describe, expect, it } from 'vitest';
import {
  CATALOG_IMPORT_FIELDS,
  columnKey,
  guessColumns,
  guessHeaderRow,
  HEADER_ROW_SCAN,
  HEADER_WORDS,
} from '../../src/catalog/import-columns';
import { SPEC_FIELDS } from '../../src/catalog/specs';
import { COMPONENT_KINDS } from '../../src/catalog/vocabulary';
import { UI_LANGUAGES } from '../../src/format/languages';

/** The field each header was placed on, in column order. */
function fieldsOf(headers: readonly string[]) {
  return guessColumns(headers).map((guess) => guess.field);
}

describe('guessColumns — headers in any launch language (§M01.4 localisation notes)', () => {
  const english = ['Brand', 'Model No.', 'Rate (₹)', 'Wattage (Wp)', 'Warranty Years', 'Category'];
  const hindi = ['ब्रांड', 'मॉडल नंबर', 'कीमत', 'वॉट', 'वारंटी', 'प्रकार'];
  const marathi = ['ब्रँड', 'मॉडेल क्रमांक', 'किंमत', 'वॅट', 'हमी', 'प्रकार'];
  const expected = ['brand', 'model', 'rate', 'watt', 'warrantyYears', 'kind'];

  it.each([
    ['English', english],
    ['Hindi', hindi],
    ['Marathi', marathi],
  ])('a %s header row proposes the same fields as the English one', (_, headers) => {
    expect(fieldsOf(headers)).toEqual(expected);
  });

  it.each([
    ['English', english],
    ['Hindi', hindi],
    ['Marathi', marathi],
  ])('each %s header comes back exactly as the file wrote it, untranslated', (_, headers) => {
    expect(guessColumns(headers).map((guess) => guess.header)).toEqual(headers);
  });

  it.each([
    ['upper case', 'RATE', 'rate'],
    ['a unit in brackets', 'Rate (₹)', 'rate'],
    ['a trailing unit word', 'Length mm', 'lengthMm'],
    ['two trailing unit words', 'Price INR Rs', 'rate'],
    ['punctuation', 'Model-No.', 'model'],
    ['outer and inner spaces', '  Unit   Price  ', 'rate'],
    ['a header that is only a unit', 'kg', null],
    ['a header nobody uses', 'Supplier code', null],
    ['an empty header', '', null],
  ])('a header with %s reads as its field (%s)', (_, header, field) => {
    expect(fieldsOf([header])).toEqual([field]);
  });

  it('a field is placed once: the first column naming it wins and the next is left open', () => {
    expect(fieldsOf(['Price', 'Rate', 'Brand'])).toEqual(['rate', null, 'brand']);
  });

  it.each(
    CATALOG_IMPORT_FIELDS.flatMap((field) =>
      UI_LANGUAGES.flatMap((language) => HEADER_WORDS[field][language]).map(
        (word) => [word, field] as const,
      ),
    ),
  )('the header word %s places %s, and no other field claims it', (word, field) => {
    expect(fieldsOf([word])).toEqual([field]);
  });

  it("every import field past the item's identity and price fills a field some envelope declares", () => {
    const envelopeFields = new Set<string>(
      COMPONENT_KINDS.flatMap((kind) => SPEC_FIELDS[kind].map((field) => field.path)),
    );
    const identity = new Set<string>(['kind', 'brand', 'model', 'rate']);
    const fillsNothing = CATALOG_IMPORT_FIELDS.filter(
      (field) => !identity.has(field) && !envelopeFields.has(field),
    );
    expect(fillsNothing).toEqual([]);
  });

  it.each(
    UI_LANGUAGES.flatMap((language) =>
      (['kind', 'brand', 'model', 'rate'] as const).map((field) => [language, field] as const),
    ),
  )("a sheet in %s can name the item's %s in its own words", (language, field) => {
    expect(HEADER_WORDS[field][language].length).toBeGreaterThan(0);
  });

  it.each([
    ['Type', 'a product kind or a cell type'],
    ['Company', 'the brand or the supplier'],
    ['Cost', 'the buying price or the selling one'],
  ])('a header that could name two fields, %s (%s), is left for the person to place', (header) => {
    expect(fieldsOf([header])).toEqual([null]);
  });

  it('every field a spec envelope declares can be filled by an import', () => {
    const envelopeFields = new Set(
      COMPONENT_KINDS.flatMap((kind) => SPEC_FIELDS[kind].map((field) => field.path)),
    );
    const importable = new Set<string>(CATALOG_IMPORT_FIELDS);
    expect([...envelopeFields].filter((path) => !importable.has(path))).toEqual([]);
  });

  it.each([
    ['a unit after the name', 'Weight kg', 'weight'],
    ['a name that is a unit', 'w', 'w'],
  ])('columnKey drops %s but never the whole header', (_, header, key) => {
    expect(columnKey(header)).toBe(key);
  });
});

describe('guessHeaderRow — the header row sits under a title block', () => {
  const title = ['Rooftop Distributors — price list', '', ''];
  const blank = ['', '', ''];
  const header = ['Brand', 'Model', 'Rate'];
  const data = ['Waaree', 'WS-545', '13,200'];

  it.each([
    ['the first row', [header, data], 0],
    ['under a two-line title block', [title, blank, header, data], 2],
    [
      'the last row scanned',
      [...Array(HEADER_ROW_SCAN - 1).fill(blank), header],
      HEADER_ROW_SCAN - 1,
    ],
    ['one row past the scan', [...Array(HEADER_ROW_SCAN).fill(blank), header], 0],
    ['no row naming a field', [title, data], 0],
    ['an empty sheet', [], 0],
  ] as const)('a header row as %s is found at row %#', (_, rows, row) => {
    expect(guessHeaderRow(rows)).toBe(row);
  });

  it.each([
    [
      'a tie goes to the earliest row',
      [
        ['Brand', 'Model'],
        ['Model', 'Brand'],
      ],
      0,
    ],
    ['a later row naming more fields wins', [['Brand', 'Model'], header], 1],
  ] as const)('%s', (_, rows, row) => {
    expect(guessHeaderRow(rows)).toBe(row);
  });
});
