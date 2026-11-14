import { describe, expect, it } from 'vitest';
import { shareToastWords } from '../src/copy/proposal-after-messages';
import { createTranslator } from '../src/runtime';

describe('the share toast says only what happened', () => {
  it.each([
    [
      '16 Nov',
      'Marked as shared · follow-up on 16 Nov',
      'Link copied · marked as shared · follow-up on 16 Nov',
    ],
    // A share again of an answered version raised no follow-up: none is named.
    [null, 'Marked as shared', 'Link copied · marked as shared'],
  ])('follow-up %s', async (followUpOn, shared, copied) => {
    const { t } = await createTranslator('en');
    const words = shareToastWords(t, followUpOn);
    expect([words.shared, words.copied]).toEqual([shared, copied]);
  });
});
