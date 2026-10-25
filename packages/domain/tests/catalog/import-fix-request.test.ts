import { describe, expect, it } from 'vitest';
import { type ImportFixRow, importFixRequest } from '../../src/catalog/import-fix-request';

const ROW: ImportFixRow = {
  rowNumber: 11,
  cells: { rate: '2,380/pc', kind: 'Cabel' },
  repeats: null,
};
const BARE: ImportFixRow = { rowNumber: 12, cells: {}, repeats: null };

describe('importFixRequest — what a card sends, and what takes it back', () => {
  it.each([
    [
      'a price, undone by the file’s own text',
      ROW,
      { act: 'price', price: '104' },
      { target: 11, body: { cells: { rate: '104' } }, undo: { cells: { rate: '2,380/pc' } } },
    ],
    [
      'a price on an empty cell, undone by an empty one',
      BARE,
      { act: 'price', price: '104' },
      { target: 12, body: { cells: { rate: '104' } }, undo: { cells: { rate: '' } } },
    ],
    [
      'a kind',
      ROW,
      { act: 'kind', kind: 'inverter' },
      { target: 11, body: { cells: { kind: 'inverter' } }, undo: { cells: { kind: 'Cabel' } } },
    ],
    [
      'an answer, taken back by none',
      ROW,
      { act: 'answer', answer: 'keep_catalog_spec' },
      { target: 11, body: { answer: 'keep_catalog_spec' }, undo: { answer: null } },
    ],
    [
      'leaving the row out',
      ROW,
      { act: 'leaveOut' },
      { target: 11, body: { leaveOut: true }, undo: { leaveOut: false } },
    ],
    [
      'this row’s price, by leaving out the row it repeats',
      { ...ROW, repeats: { rowNumber: 9 } },
      { act: 'repeat' },
      { target: 9, body: { leaveOut: true }, undo: { leaveOut: false } },
    ],
  ] as const)('%s', (_, row, choice, request) => {
    expect(importFixRequest(row, choice)).toEqual(request);
  });

  it('sends nothing for a repeat that names no earlier row', () => {
    expect(importFixRequest(ROW, { act: 'repeat' })).toBeNull();
  });
});
