import { describe, expect, it } from 'vitest';
import { richTextParagraphs } from '../../src/commerce/rich-text';
import { termsValidityDays } from '../../src/proposals/validity';
import { PROPOSAL_VALIDITY_DAYS } from '../../src/proposals/vocabulary';

describe('the validity a proposal’s terms state (M06-15)', () => {
  const english = richTextParagraphs(['Valid for 30 days.', 'Payment in tranches.']);
  const hindi = richTextParagraphs(['30 दिनों के लिए मान्य।', 'किस्तों में भुगतान।']);
  const platform = [english, hindi];

  it.each([
    ['the platform’s terms as filled in English', english, PROPOSAL_VALIDITY_DAYS],
    ['the platform’s terms as filled in Hindi', hindi, PROPOSAL_VALIDITY_DAYS],
    ['a company’s own words', richTextParagraphs(['Valid for a fortnight.']), null],
    [
      'the platform’s terms with one sentence added',
      richTextParagraphs(['Valid for 30 days.', 'Payment in tranches.', 'Extra.']),
      null,
    ],
    [
      'the platform’s terms with one sentence cut',
      richTextParagraphs(['Valid for 30 days.']),
      null,
    ],
    ['no terms at all', richTextParagraphs([]), null],
  ])('%s', (_, terms, days) => {
    expect(termsValidityDays(terms, platform)).toBe(days);
  });

  it('no platform wording to read against states none', () => {
    expect(termsValidityDays(english, [])).toBeNull();
  });
});
