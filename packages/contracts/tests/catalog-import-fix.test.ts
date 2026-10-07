import { CATALOG_IMPORT_ROW_NUMBER_MAX } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { catalogImportContract, catalogImportRowFixSchema } from '../src/catalog-import';

/** Where each issue points, as the api's envelope reports it in `details[].path`. */
const issuePaths = (body: unknown) => {
  const parsed = catalogImportRowFixSchema.safeParse(body);
  return parsed.success ? null : parsed.error.issues.map((issue) => issue.path.join('.'));
};

describe('a row fix body', () => {
  it.each([
    ['typed cells', { cells: { watt: '550', rate: '' } }, { cells: { watt: '550', rate: '' } }],
    ['a row left out', { leaveOut: true }, { leaveOut: true }],
    ['a row brought back', { leaveOut: false }, { leaveOut: false }],
    ['an answer', { answer: 'keep_catalog_spec' }, { answer: 'keep_catalog_spec' }],
  ])('takes %s as one act', (_, body, act) => {
    expect(catalogImportRowFixSchema.parse(body)).toEqual(act);
  });

  it.each([
    ['a second act', { leaveOut: true, answer: 'keep_catalog_spec' }, ['answer']],
    ['a field no import has', { cells: { notAField: 'x' } }, ['cells.notAField']],
    ['an answer no conflict offers', { answer: 'edit_platform_spec' }, ['answer']],
    ['a key no fix has', { leaveOut: true, note: 'x' }, ['']],
    ['no act at all', {}, ['']],
  ])('refuses %s, naming where', (_, body, paths) => {
    expect(issuePaths(body)).toEqual(paths);
  });
});

describe('the row a fix names', () => {
  const rowNumber = (value: number) =>
    catalogImportContract.fix.pathParams.safeParse({ id: crypto.randomUUID(), rowNumber: value })
      .success;

  it.each([
    ['the first row', 1, true],
    ['the largest the column holds', CATALOG_IMPORT_ROW_NUMBER_MAX, true],
    ['one past it', CATALOG_IMPORT_ROW_NUMBER_MAX + 1, false],
    ['row zero', 0, false],
  ])('%s → %s', (_, value, taken) => {
    expect(rowNumber(value)).toBe(taken);
  });
});
