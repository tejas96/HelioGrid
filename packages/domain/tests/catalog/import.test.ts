import { describe, expect, it } from 'vitest';
import {
  CATALOG_IMPORT_STATES,
  countImportMatches,
  hasImportPreview,
  takesImportMapping,
} from '../../src/catalog/import';

describe('the job states a mapping and a preview belong to', () => {
  const taking = ['mapped', 'matching', 'previewed'];
  const previewed = ['previewed', 'running', 'completed'];

  it.each(CATALOG_IMPORT_STATES)('%s', (state) => {
    expect([takesImportMapping(state), hasImportPreview(state)]).toEqual([
      taking.includes(state),
      previewed.includes(state),
    ]);
  });
});

describe("countImportMatches — the preview's figures", () => {
  it.each([
    ['no rows', {}, { rows: 0, matched: 0, newItems: 0, needsAttention: 0, leftOut: 0 }],
    [
      'one of each',
      { price_override: 1, own_item_price: 1, new_item: 1, needs_attention: 1, left_out: 1 },
      { rows: 5, matched: 2, newItems: 1, needsAttention: 1, leftOut: 1 },
    ],
    [
      'the brief’s file of 412 (`SCR-M01-17` decision 3)',
      { price_override: 300, own_item_price: 18, new_item: 87, needs_attention: 7 },
      { rows: 412, matched: 318, newItems: 87, needsAttention: 7, leftOut: 0 },
    ],
  ] as const)('%s', (_, byOutcome, counts) => {
    expect(countImportMatches(byOutcome)).toEqual(counts);
  });
});
