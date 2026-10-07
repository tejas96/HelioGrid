import { describe, expect, it } from 'vitest';
import {
  CATALOG_IMPORT_ROW_RESULTS,
  CATALOG_IMPORT_STATES,
  countImportMatches,
  countImportResults,
  fixesImportRow,
  hasImportPreview,
  hasImportRun,
  importRowsToFix,
  importRunProgress,
  takesImportFix,
  takesImportMapping,
  takesImportRun,
  wroteImportRow,
} from '../../src/catalog/import';

describe('the job states a mapping and a preview belong to', () => {
  const taking = ['mapped', 'matching', 'previewed'];
  const previewed = ['previewed', 'running', 'completed'];

  const ran = ['running', 'completed'];
  const runnable = ['previewed', 'completed'];

  it.each(CATALOG_IMPORT_STATES)('%s', (state) => {
    expect([
      takesImportMapping(state),
      hasImportPreview(state),
      takesImportRun(state),
      hasImportRun(state),
      takesImportFix(state),
    ]).toEqual([
      taking.includes(state),
      previewed.includes(state),
      runnable.includes(state),
      ran.includes(state),
      runnable.includes(state),
    ]);
  });
});

describe("importRunProgress and countImportResults — the run's figures", () => {
  it.each([
    ['nothing run yet', {}, { done: 0, total: 0 }],
    ['every row still to write', { pending: 405, left_out: 7 }, { done: 0, total: 405 }],
    [
      'the board’s run, part way (`SCR-M01-17` pass 3)',
      { price_applied: 150, product_created: 60, failed: 8, pending: 187, left_out: 7 },
      { done: 218, total: 405 },
    ],
    ['every row left out', { left_out: 3 }, { done: 0, total: 0 }],
  ] as const)('%s', (_, byResult, progress) => {
    expect(importRunProgress(byResult)).toEqual(progress);
  });

  it.each([
    ['nothing run yet', {}, { priceApplied: 0, productCreated: 0, leftOut: 0, failed: 0 }],
    [
      'one of each, and a row still to write',
      { price_applied: 1, product_created: 1, left_out: 1, failed: 1, pending: 1 },
      { priceApplied: 1, productCreated: 1, leftOut: 1, failed: 1 },
    ],
  ] as const)('%s', (_, byResult, results) => {
    expect(countImportResults(byResult)).toEqual(results);
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

describe('fixesImportRow and wroteImportRow — which rows *Fix the N rows* takes back', () => {
  const open = ['left_out', 'failed'];
  const written = ['price_applied', 'product_created'];

  it.each([null, ...CATALOG_IMPORT_ROW_RESULTS])('a row whose result is %s', (result) => {
    expect([
      fixesImportRow('previewed', result),
      fixesImportRow('completed', result),
      fixesImportRow('running', result),
      wroteImportRow(result),
    ]).toEqual([
      true,
      result !== null && open.includes(result),
      false,
      written.includes(result ?? ''),
    ]);
  });
});

describe("importRowsToFix — the N of the report's act", () => {
  it.each([
    ['nothing open', { priceApplied: 3, productCreated: 1, leftOut: 0, failed: 0 }, 0],
    ['left out only', { priceApplied: 0, productCreated: 0, leftOut: 7, failed: 0 }, 7],
    ['left out and failed', { priceApplied: 405, productCreated: 0, leftOut: 7, failed: 2 }, 9],
  ] as const)('%s', (_, results, n) => {
    expect(importRowsToFix(results)).toBe(n);
  });
});
