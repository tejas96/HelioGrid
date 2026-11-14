import { describe, expect, it } from 'vitest';
import { type RichTextValue, richTextParagraphs } from '../../src/commerce/rich-text';
import {
  proposalSheetsOf,
  sheetNumber,
  termsEstimate,
  termsFitTheirPages,
  termsPagesOf,
} from '../../src/proposals';
import { aFieldSet } from './proposal-fixture';

const CLAUSE =
  'The company installs the system within the time this proposal states, once the site is ready, the distribution company has approved the net meter and the payments are made as the plan sets out.';
const MARATHI_CLAUSE =
  'कंपनी या प्रस्तावात नमूद केलेल्या वेळेत प्रणाली बसवेल, जर जागा तयार असेल, वितरण कंपनीकडून नेट-मीटर मंजुरी मिळाली असेल आणि वरील योजनेनुसार देयके दिली गेली असतील.';

const clauses = (count: number, clause = CLAUSE): RichTextValue =>
  richTextParagraphs(Array.from({ length: count }, (_, index) => `${index + 1}. ${clause}`));

const wordsOf = (terms: RichTextValue): string =>
  terms.blocks
    .flatMap((block) =>
      block.type === 'logo'
        ? []
        : 'items' in block
          ? block.items.map((item) => item.map((span) => span.text).join(''))
          : [block.spans.map((span) => span.text).join('')],
    )
    .join(' ')
    .split(/\s+/)
    .join(' ');

describe('the terms over their pages (M06-15)', () => {
  it.each([
    ['a short text', clauses(3), 1],
    ['a two-page text', clauses(12), 2],
    ['a three-page text', clauses(20), 3],
  ])('%s prints on the pages step 9 estimates', (_, terms, pages) => {
    expect(termsPagesOf(terms)).toHaveLength(pages);
    expect(termsEstimate(terms).pages).toBe(termsPagesOf(terms).length);
    expect(termsFitTheirPages(terms)).toBe(true);
  });

  it('a text past three pages does not fit, and is still planned whole', () => {
    const terms = clauses(30);
    expect(termsPagesOf(terms).length).toBeGreaterThan(3);
    expect(termsFitTheirPages(terms)).toBe(false);
  });

  it('empty terms still print their one page', () => {
    expect(termsPagesOf(richTextParagraphs([]))).toHaveLength(1);
    expect(termsEstimate(richTextParagraphs([]))).toEqual({ pages: 1, chars: 0 });
  });

  it('Devanagari terms flow over pages too, losing no word', () => {
    const terms = clauses(40, MARATHI_CLAUSE);
    const pages = termsPagesOf(terms);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.map(wordsOf).join(' ')).toBe(wordsOf(terms));
  });

  it('one paragraph longer than a page is cut at a word and carried on, losing nothing', () => {
    const terms = richTextParagraphs([CLAUSE.repeat(20)]);
    const pages = termsPagesOf(terms);
    expect(pages).toHaveLength(2);
    expect(pages.map(wordsOf).join(' ')).toBe(wordsOf(terms));
  });

  it('a numbered list carried over keeps counting', () => {
    const terms: RichTextValue = {
      version: 1,
      blocks: [{ type: 'ol', items: Array.from({ length: 40 }, () => [{ text: CLAUSE }]) }],
    };
    const [first, second] = termsPagesOf(terms);
    const firstList = first?.blocks[0];
    const secondList = second?.blocks[0];
    if (firstList?.type !== 'ol' || secondList?.type !== 'ol') throw new Error('not lists');
    expect(secondList.start).toBe(firstList.items.length + 1);
  });

  it('the document counts every terms sheet, and numbers the pages after them on', () => {
    const sheets = proposalSheetsOf(
      ['cover', 'price', 'terms', 'bank'],
      aFieldSet({ terms: clauses(12) }),
    );
    expect(sheets).toEqual([
      { page: 'cover', part: 0 },
      { page: 'price', part: 0 },
      { page: 'terms', part: 0 },
      { page: 'terms', part: 1 },
      { page: 'bank', part: 0 },
    ]);
    expect(sheetNumber(sheets, 'terms', 1)).toBe(4);
    expect(sheetNumber(sheets, 'bank', 0)).toBe(5);
  });
});
