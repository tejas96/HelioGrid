import { describe, expect, it } from 'vitest';
import {
  firstAttentionReason,
  importFixAct,
  importReadyCount,
} from '../../src/catalog/import-wizard';

describe('importReadyCount — the rows *Import N rows* writes', () => {
  it.each([
    [{ rows: 412, matched: 318, newItems: 87, needsAttention: 7, leftOut: 0 }, 405],
    [{ rows: 412, matched: 319, newItems: 87, needsAttention: 6, leftOut: 0 }, 406],
    [{ rows: 3, matched: 0, newItems: 0, needsAttention: 2, leftOut: 1 }, 0],
  ])('%o → %i', (counts, ready) => {
    expect(importReadyCount(counts)).toBe(ready);
  });
});

describe('firstAttentionReason — the question a card asks first', () => {
  it('asks in the vocabulary order, whatever order the pass wrote', () => {
    expect(
      firstAttentionReason([{ reason: 'repeated_in_file' }, { reason: 'price_missing' }]),
    ).toBe('price_missing');
  });

  it('asks nothing of a row with no reason', () => {
    expect(firstAttentionReason([])).toBeNull();
  });
});

describe('importFixAct — the act a card offers for its question', () => {
  it.each([
    ['price_missing', 'previewed', 'price'],
    ['price_unreadable', 'previewed', 'price'],
    ['price_below_zero', 'previewed', 'price'],
    ['price_finer_than_minor_unit', 'previewed', 'price'],
    ['spec_conflict', 'previewed', 'answer'],
    ['several_matches', 'previewed', 'pick'],
    ['kind_missing', 'previewed', 'kind'],
    ['repeated_in_file', 'previewed', 'repeat'],
    ['repeated_in_file', 'completed', 'none'],
    ['brand_or_model_missing', 'previewed', 'none'],
    ['spec_missing', 'previewed', 'none'],
    ['spec_invalid', 'previewed', 'none'],
  ] as const)('%s on a %s job → %s', (reason, status, act) => {
    expect(importFixAct(reason, status)).toBe(act);
  });
});
