import { describe, expect, it } from 'vitest';
import type { CatalogImportSheet } from '../../src/catalog/import';
import type { CatalogImportField } from '../../src/catalog/import-columns';
import {
  type CatalogImportMapping,
  importColumnsProblem,
  importMappingProblem,
  mappedRows,
  sameImportMapping,
} from '../../src/catalog/import-mapping';

const PLACED: readonly (CatalogImportField | null)[] = ['brand', 'model', 'rate'];

const sheet = (rowCount: number, columnCount: number, topRows = 3): CatalogImportSheet => ({
  name: 'Price list',
  rowCount,
  columnCount,
  topRows: Array.from({ length: topRows }, () => []),
});

const mapping = (over: Partial<CatalogImportMapping> = {}): CatalogImportMapping => ({
  sheet: 0,
  headerRow: 0,
  columns: PLACED,
  ...over,
});

describe('importColumnsProblem — brand, model and rate each placed once, no field twice', () => {
  it.each([
    ['all three placed, the rest left', ['brand', null, 'model', 'rate', 'watt'], null],
    ['brand unplaced', [null, 'model', 'rate'], 'required_field_unplaced'],
    ['model unplaced', ['brand', 'rate'], 'required_field_unplaced'],
    ['rate unplaced', ['brand', 'model', 'watt'], 'required_field_unplaced'],
    ['no column at all', [], 'required_field_unplaced'],
    ['a required field twice', ['brand', 'model', 'rate', 'rate'], 'field_placed_twice'],
    ['a spec field twice', ['brand', 'model', 'rate', 'watt', 'watt'], 'field_placed_twice'],
  ] as const)('%s', (_, columns, problem) => {
    expect(importColumnsProblem(columns)).toBe(problem);
  });
});

describe('importMappingProblem — the mapping fits the sheet the file holds', () => {
  const sheets = [sheet(40, 3), sheet(12, 5, 10)];

  it.each([
    ['the first sheet, its first row, its three columns', mapping(), null],
    ['the last sheet', mapping({ sheet: 1 }), null],
    ['a sheet past the last', mapping({ sheet: 2 }), 'sheet_missing'],
    ['a sheet below zero', mapping({ sheet: -1 }), 'sheet_missing'],
    ['the last top row as the header', mapping({ headerRow: 2 }), null],
    ['a header one past the top rows', mapping({ headerRow: 3 }), 'header_row_outside_top_rows'],
    ['a header below zero', mapping({ headerRow: -1 }), 'header_row_outside_top_rows'],
    [
      'one column more than the sheet fills',
      mapping({ columns: [...PLACED, null] }),
      'more_columns_than_sheet',
    ],
    ['fewer columns than the sheet fills', mapping({ sheet: 1, columns: PLACED }), null],
    ['the columns refused first', mapping({ columns: ['brand'] }), 'required_field_unplaced'],
  ] as const)('%s', (_, candidate, problem) => {
    expect(importMappingProblem(candidate, sheets)).toBe(problem);
  });
});

describe('mappedRows — every filled row below the header, by its sheet row number', () => {
  const rows = [
    ['Supplier price list'],
    ['Brand', 'Model', 'Rate', 'Notes'],
    ['Waaree', 'WS-540', '13,200', 'new'],
    [],
    ['', '  ', '', 'a note in an unmapped column'],
    ['Waaree', 'WS-550'],
  ];
  const columns: readonly (CatalogImportField | null)[] = ['brand', 'model', 'rate', null];

  it('starts below the header, keeps the sheet row numbers and skips rows with no mapped text', () => {
    expect(mappedRows(rows, { sheet: 0, headerRow: 1, columns })).toEqual([
      { rowNumber: 3, cells: { brand: 'Waaree', model: 'WS-540', rate: '13,200' } },
      { rowNumber: 6, cells: { brand: 'Waaree', model: 'WS-550' } },
    ]);
  });

  it('keeps each cell exactly as the file wrote it', () => {
    const [row] = mappedRows([['h'], [' Waaree ', 'WS-540 ', '1,32,000']], {
      sheet: 0,
      headerRow: 0,
      columns,
    });
    expect(row?.cells).toEqual({ brand: ' Waaree ', model: 'WS-540 ', rate: '1,32,000' });
  });

  it('reads nothing when the header is the last row', () => {
    expect(mappedRows(rows, { sheet: 0, headerRow: 5, columns })).toEqual([]);
  });
});

describe('sameImportMapping — a second send of one mapping starts no new pass', () => {
  it.each([
    ['the same mapping', mapping(), true],
    ['nothing stored yet', null, false],
    ['another sheet', mapping({ sheet: 1 }), false],
    ['another header row', mapping({ headerRow: 1 }), false],
    ['one more column', mapping({ columns: [...PLACED, null] }), false],
    ['two columns swapped', mapping({ columns: ['model', 'brand', 'rate'] }), false],
  ] as const)('%s', (_, stored, same) => {
    expect(sameImportMapping(stored, mapping())).toBe(same);
  });
});
