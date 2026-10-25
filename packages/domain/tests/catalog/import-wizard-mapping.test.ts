import { describe, expect, it } from 'vitest';
import type { CatalogImportSheet } from '../../src/catalog/import';
import { guessImportMapping, mappingForHeader } from '../../src/catalog/import-wizard';

const sheet = (name: string, topRows: string[][], columnCount = 4): CatalogImportSheet => ({
  name,
  rowCount: 40,
  columnCount,
  topRows,
});

const NOTES = sheet('Notes', [['Read me first'], ['Prices exclude freight']]);
const LIST = sheet('Price list', [
  ['Suryodaya supplies — August'],
  ['Brand', 'Model', 'Rate', 'Remarks'],
  ['Waaree', 'WS-545', '13,200', ''],
]);

describe('guessImportMapping — the sheet, header row and columns the device proposes', () => {
  it('takes the first sheet whose top names a field, and its best header row', () => {
    expect(guessImportMapping([NOTES, LIST])).toEqual({
      sheet: 1,
      headerRow: 1,
      columns: ['brand', 'model', 'rate', null],
    });
  });

  it('falls back to the first sheet when no sheet names a field', () => {
    expect(guessImportMapping([NOTES])).toEqual({
      sheet: 0,
      headerRow: 0,
      columns: [null, null, null, null],
    });
  });

  it('proposes nothing for a file with no sheet', () => {
    expect(guessImportMapping([])).toBeNull();
  });

  it('guesses the columns again for a header row the person picks', () => {
    expect(mappingForHeader([NOTES, LIST], 1, 0)).toEqual({
      sheet: 1,
      headerRow: 0,
      columns: [null, null, null, null],
    });
  });

  it('pads a short header row to every column the sheet fills', () => {
    expect(mappingForHeader([LIST], 0, 1).columns).toHaveLength(4);
  });
});
