import { describe, expect, it } from 'vitest';
import {
  catalogImportRowFixSchema,
  catalogImportRowsQuerySchema,
} from '../src/catalog-import-rows';

const read = (query: Record<string, string>) => catalogImportRowsQuerySchema.safeParse(query);

describe('the rows read takes one outcome or a list, and a bounded search', () => {
  it.each([
    ['one outcome', { outcome: 'new_item' }, { outcome: 'new_item' }],
    [
      'a list of outcomes, each once',
      { outcomes: 'price_override,own_item_price,price_override' },
      { outcomes: ['price_override', 'own_item_price'] },
    ],
    ['a list of results', { results: 'left_out,failed' }, { results: ['left_out', 'failed'] }],
    ['a search of one character', { q: 'R' }, { q: 'R' }],
    ['a search of 100 characters', { q: 'x'.repeat(100) }, { q: 'x'.repeat(100) }],
    ['a search with its outer spaces', { q: '  Rayzon ' }, { q: 'Rayzon' }],
  ])('takes %s', (_, query, expected) => {
    const parsed = read(query);
    expect(parsed.success && parsed.data).toEqual(expect.objectContaining(expected));
  });

  it.each([
    ['an empty search', { q: '' }],
    ['a search of spaces only', { q: '   ' }],
    ['a search of 101 characters', { q: 'x'.repeat(101) }],
    ['an outcome no import has', { outcomes: 'price_override,edited' }],
    ['an empty list', { outcomes: '' }],
    ['a result no run has', { results: 'left_out,skipped' }],
  ])('refuses %s', (_, query) => {
    expect(read(query).success).toBe(false);
  });
});

describe('a fix takes an answer back', () => {
  it('reads a null answer as the act of taking it back', () => {
    expect(catalogImportRowFixSchema.parse({ answer: null })).toEqual({ answer: null });
  });
});
