/**
 * The Payment terms page's chosen words (`SCR-M01-20`), against the real catalogs: the meter's
 * line and the save's refusal off the one verdict, the saved line, and every stage's words. Every
 * Hindi and Marathi line is a draft for the native review.
 */
import { allocationVerdict, basisPoints, PROJECT_STAGE_CHAIN } from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import { allocationRefusal, allocationSentence } from '../src/copy/allocation';
import { paymentTermsSavedLine, paymentTermsWords } from '../src/copy/payment-terms';
import { stageWords } from '../src/copy/project-stages';
import { createTranslator } from '../src/runtime';

type T = Awaited<ReturnType<typeof createTranslator>>['t'];
let en: T;
let hi: T;
beforeAll(async () => {
  ({ t: en } = await createTranslator('en'));
  ({ t: hi } = await createTranslator('hi'));
});
const verdictOf = (...shares: number[]) => allocationVerdict(shares.map(basisPoints));
const formats = { date: () => '22 Aug 2026' };

describe('the meter’s line and the save’s refusal read one verdict (M01-54)', () => {
  it.each([
    {
      shares: [1000, 6000, 2000],
      line: '10% unallocated.',
      refused: 'Allocate the remaining 10% to save these terms.',
    },
    {
      shares: [3333, 3333, 3333],
      line: '0.01% unallocated.',
      refused: 'Allocate the remaining 0.01% to save these terms.',
    },
    {
      shares: [3000, 6000, 2800],
      line: '18% over-allocated.',
      refused: 'Take 18% off the tranches to save these terms.',
    },
    { shares: [3333, 3333, 3334], line: 'Fully allocated.', refused: null },
  ])('$shares → $line', ({ shares, line, refused }) => {
    const verdict = verdictOf(...shares);
    expect(allocationSentence(en, verdict)).toBe(line);
    expect(allocationRefusal(en, verdict)).toBe(refused);
  });

  it('says the remainder in Hindi', () => {
    expect(allocationSentence(hi, verdictOf(3000, 2800, 3000))).toBe('12% बाँटा नहीं गया।');
  });
});

describe('the saved line', () => {
  it.each([
    [
      { kind: 'saved', at: 0, name: 'Rajesh Kulkarni' } as const,
      'Saved and in force · Rajesh Kulkarni, 22 Aug 2026',
    ],
    [{ kind: 'saved-unknown' } as const, 'Saved and in force'],
    [{ kind: 'never-set' } as const, 'Added when your account was created · not changed since'],
  ])('%o → %s', (standing, line) => {
    expect(paymentTermsSavedLine(en, standing, formats)).toBe(line);
  });
});

describe('the page’s named words', () => {
  it('a card names itself, and says when it is the default', () => {
    const words = paymentTermsWords(en);
    expect(words.cardLabel('Standard 30/60/10', false)).toBe('Standard 30/60/10');
    expect(words.cardLabel('Standard 10/60/20/10', true)).toBe('Standard 10/60/20/10, default');
  });

  it('the cap names the twelve, and a stage’s pill the whole tranche name', () => {
    const words = paymentTermsWords(en);
    expect(words.cap).toBe('Payment terms hold up to 12 tranches.');
    expect(words.trancheShare('Booking advance', '33.33')).toBe('Booking advance · 33.33%');
  });
});

describe('every stage’s words (SCR-M01-20, decision 1)', () => {
  it('gives every chain stage a short form and a sentence, in Hindi too', () => {
    const english = stageWords(en);
    const hindi = stageWords(hi);
    for (const stage of PROJECT_STAGE_CHAIN) {
      expect(english[stage].when.startsWith('When ')).toBe(true);
      expect(hindi[stage].short).not.toBe(english[stage].short);
    }
    expect(english.won).toEqual({
      short: 'Customer signs',
      when: 'When your customer signs and the order is confirmed',
    });
  });
});
