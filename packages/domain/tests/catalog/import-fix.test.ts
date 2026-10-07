import { describe, expect, it } from 'vitest';
import {
  type CatalogImportRowState,
  effectiveImportCells,
  fixedImportRow,
  importFixProblem,
  takesImportAnswer,
} from '../../src/catalog/import-fix';

const aRow = (over: Partial<CatalogImportRowState> = {}): CatalogImportRowState => ({
  cells: { brand: 'Waaree', model: 'WS-545', rate: '13200', watt: '545' },
  fix: {},
  leftOut: false,
  answer: null,
  attention: [],
  ...over,
});
const CONFLICTED = aRow({ attention: [{ reason: 'spec_conflict' }] });

describe('which rows take an answer', () => {
  it.each([
    ['a spec conflict', CONFLICTED, true],
    ['an answer already given, to change it', aRow({ answer: 'keep_catalog_spec' }), true],
    ['a clean row', aRow(), false],
    ['a row asking something else', aRow({ attention: [{ reason: 'price_missing' }] }), false],
  ])('%s → %s', (_, row, takes) => {
    expect(takesImportAnswer(row)).toBe(takes);
  });

  it.each([
    ['an answer where none is asked', aRow(), { answer: 'import_as_own_item' }, 'asks_no_question'],
    ['an answer to a conflict', CONFLICTED, { answer: 'import_as_own_item' }, null],
    ['a typed cell on a clean row', aRow(), { cells: { watt: '550' } }, null],
    ['a clean row left out', aRow(), { leaveOut: true }, null],
  ] as const)('%s → %s', (_, row, fix, problem) => {
    expect(importFixProblem(row, fix)).toBe(problem);
  });
});

describe('a row after its fix', () => {
  it('lays typed cells over the file’s, field by field, and never rewrites the file’s', () => {
    const typed = fixedImportRow(aRow({ fix: { kind: 'panel' } }), { cells: { watt: '550' } });

    expect(typed.fix).toEqual({ kind: 'panel', watt: '550' });
    expect(effectiveImportCells({ ...aRow(), ...typed })).toEqual({
      brand: 'Waaree',
      model: 'WS-545',
      rate: '13200',
      watt: '550',
      kind: 'panel',
    });
  });

  it('blanks a field typed empty', () => {
    const typed = fixedImportRow(aRow(), { cells: { watt: '' } });

    expect(effectiveImportCells({ ...aRow(), ...typed }).watt).toBe('');
  });

  it('leaves a row out and brings it back, keeping what was typed', () => {
    const out = fixedImportRow(aRow({ fix: { watt: '550' } }), { leaveOut: true });
    const back = fixedImportRow({ ...aRow(), ...out }, { leaveOut: false });

    expect(out).toEqual({ fix: { watt: '550' }, leftOut: true, answer: null });
    expect(back.leftOut).toBe(false);
  });

  it('keeps an answer while the row names the same product', () => {
    const answered = { ...CONFLICTED, answer: 'keep_catalog_spec' as const };

    expect(fixedImportRow(answered, { cells: { watt: '550' } }).answer).toBe('keep_catalog_spec');
    expect(fixedImportRow(answered, { cells: { model: ' WS-545 ' } }).answer).toBe(
      'keep_catalog_spec',
    );
  });

  it('drops an answer once the row names another product', () => {
    const answered = { ...CONFLICTED, answer: 'import_as_own_item' as const };

    expect(fixedImportRow(answered, { cells: { model: 'WS-550' } }).answer).toBeNull();
    expect(fixedImportRow(answered, { cells: { brand: 'Adani' } }).answer).toBeNull();
  });
});
