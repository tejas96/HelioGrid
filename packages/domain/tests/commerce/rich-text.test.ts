import { describe, expect, it } from 'vitest';
import { richTextParagraphs } from '../../src/commerce/rich-text';

describe('richTextParagraphs — plain paragraphs as the one document-content shape (M06-51)', () => {
  it('makes one paragraph block per text, each a single unmarked span', () => {
    expect(richTextParagraphs(['One.', 'Two.'])).toEqual({
      version: 1,
      blocks: [
        { type: 'p', spans: [{ text: 'One.' }] },
        { type: 'p', spans: [{ text: 'Two.' }] },
      ],
    });
  });

  it('makes an empty body from no paragraphs — still a versioned value, never null', () => {
    expect(richTextParagraphs([])).toEqual({ version: 1, blocks: [] });
  });
});
