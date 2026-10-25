import {
  CATALOG_IMPORT_ATTENTION_REASONS,
  CATALOG_IMPORT_FIELDS,
  CATALOG_IMPORT_ROW_FAILURES,
  type CatalogImportAttentionReason,
  UI_LANGUAGES,
} from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { catalogImportWords, type ImportRowWordsFacts } from '../src/copy/catalog-import-rows';
import { createTranslator } from '../src/runtime';

const FACTS: ImportRowWordsFacts = {
  product: 'Rayzon Solar RSM-550',
  named: 'Rayzon Solar RSM-545',
  conflict: { field: 'Peak power (Wp)', file: '550', catalog: '545' },
  priceText: '−13,900',
  repeat: { row: 388, price: '₹7,250' },
  unit: null,
};

const wordsIn = async (language: string) =>
  catalogImportWords((await createTranslator(language as never)).t);

describe('the import wizard’s words', () => {
  it.each(UI_LANGUAGES)(
    'words every attention reason and failure in each language (%s)',
    async (language) => {
      const words = await wordsIn(language);
      for (const reason of CATALOG_IMPORT_ATTENTION_REASONS) {
        expect(words.question(reason, FACTS)).not.toBe('');
        expect(words.reason({ ...FACTS, attention: reason, failure: null })).not.toBe('');
      }
      for (const failure of CATALOG_IMPORT_ROW_FAILURES) {
        expect(words.reason({ ...FACTS, attention: null, failure })).not.toBe('');
      }
      for (const field of CATALOG_IMPORT_FIELDS) expect(words.fields[field]).not.toBe('');
    },
  );

  it.each<[CatalogImportAttentionReason, Partial<ImportRowWordsFacts>, string]>([
    ['spec_conflict', {}, 'Your file says 550; the product we carry is 545 — which is right?'],
    ['repeated_in_file', {}, 'Row 388 has the same item at ₹7,250 — which price is right?'],
    [
      'repeated_in_file',
      { repeat: { row: 388, price: null } },
      'Row 388 has the same item — which price is right?',
    ],
    ['price_missing', { unit: 'metre' }, 'The price is empty — what does one metre cost you?'],
    ['price_missing', {}, 'The price is empty — what does it cost you?'],
  ])('asks %s as the board words it', async (reason, facts, question) => {
    const words = await wordsIn('en');
    expect(words.question(reason, { ...FACTS, ...facts })).toBe(question);
  });

  it.each([
    [0, 'Import 0 rows'],
    [1, 'Import 1 row'],
    [405, 'Import 405 rows'],
  ])('counts the act: %i → %s', async (count, label) => {
    expect((await wordsIn('en')).importRows(count)).toBe(label);
  });

  it('says a left-out row the person left out', async () => {
    const words = await wordsIn('en');
    expect(words.reason({ ...FACTS, attention: null, failure: null })).toBe(
      'You left this row out. Nothing was changed for this item.',
    );
  });

  it.each([
    [7, 9, 0, 'We matched all 9 of your columns.'],
    [7, 9, 1, 'We matched 7 of your 9 columns; 1 still needs you.'],
    [6, 9, 2, 'We matched 6 of your 9 columns; 2 still need you.'],
  ])('states the guess: %i of %i, %i open', async (matched, columns, open, line) => {
    expect((await wordsIn('en')).matchedIntro(matched, columns, open)).toBe(line);
  });
});
