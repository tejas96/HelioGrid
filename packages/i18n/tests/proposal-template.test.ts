/**
 * The Proposal template page's chosen words (`SCR-M01-19`), against the real catalogs: the standing
 * line by what is known of the last save, every section's name and line, the counted words and each
 * field's refusal. Every Hindi and Marathi line is a draft for the native review.
 */
import { PROPOSAL_SECTIONS } from '@heliogrid/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  proposalTemplatePageWords,
  proposalTemplateWords,
  sectionWords,
} from '../src/copy/proposal-template';
import { templateRefusalWords } from '../src/copy/proposal-template-phase';
import { createTranslator } from '../src/runtime';

type T = Awaited<ReturnType<typeof createTranslator>>['t'];
let en: T;
let hi: T;
let mr: T;
beforeAll(async () => {
  ({ t: en } = await createTranslator('en'));
  ({ t: hi } = await createTranslator('hi'));
  ({ t: mr } = await createTranslator('mr'));
});
const AT = Date.parse('2026-08-28T10:00:00.000Z');
const formats = { date: () => '28 Aug 2026' };

describe('the standing line', () => {
  it('the standing line names who and when', () => {
    const page = {
      standing: { kind: 'saved', at: AT, name: 'Rajesh Kulkarni' },
    } as const;

    expect(proposalTemplatePageWords(en, page, formats).standing).toBe(
      'Saved and in force · Rajesh Kulkarni, 28 Aug 2026',
    );
  });

  it.each([
    ['a template never saved draws no line', { kind: 'never-set' } as const],
    ['a page still reading draws no line', null],
  ])('%s', (_case, standing) => {
    expect(proposalTemplatePageWords(en, { standing }, formats)).not.toHaveProperty('standing');
  });
});

describe('the sections', () => {
  it('every section has its words', () => {
    for (const t of [en, hi, mr]) {
      const words = sectionWords(t, 6);
      for (const section of PROPOSAL_SECTIONS) {
        expect(words(section).title).not.toBe('');
        expect(words(section).about).not.toBe('');
      }
    }
  });

  it.each([
    [1, '1 phase'],
    [6, '6 phases'],
  ])('the timeline says its phase count: %i', (count, about) => {
    expect(sectionWords(en, count)('timeline').about).toBe(about);
  });
});

describe('the counted words', () => {
  it('counts and names in the reader’s words', () => {
    const words = proposalTemplateWords(en);

    expect(words.sectionsPrint(6, 8)).toBe('6 of 8 optional sections print');
    expect(words.phaseOf(1, 6)).toBe('Phase 1 of 6');
    expect(words.pages(1)).toBe('≈ 1 page');
    expect(words.pages(3)).toBe('≈ 3 pages');
    expect(words.bankFrom('HDFC Bank')).toBe('HDFC Bank · from Business profile');
    expect(words.bankFrom(null)).toBe('not added yet · from Business profile');
    expect(words.phaseCap).toBe('A timeline holds up to 20 phases.');
    expect(words.title).toBe('Proposal template');
  });

  it('the document keeps its ruled name in every language', () => {
    expect([en, hi, mr].map((t) => proposalTemplateWords(t).proposal)).toEqual([
      'Proposal',
      'प्रस्ताव',
      'प्रस्ताव',
    ]);
  });
});

describe('the refusals', () => {
  it.each([
    ['name', 'Give this phase a name'],
    ['what', 'Say what happens in this phase'],
    ['terms', 'The terms always print, so they need words in English.'],
  ] as const)('%s', (field, words) => {
    expect(templateRefusalWords(en, field, 'needs-english')).toBe(words);
    expect(templateRefusalWords(en, field, null)).toBeNull();
  });

  it('a name too long says the limit', () => {
    expect(templateRefusalWords(en, 'name', 'too-long')).toBe(
      'A phase name holds up to 120 characters',
    );
  });
});
