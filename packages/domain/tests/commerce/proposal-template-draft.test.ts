import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECTIONS_INCLUDED,
  type ProposalSection,
} from '../../src/commerce/proposal-template-defaults';
import {
  EMPTY_PHASE,
  hasWords,
  phaseWithText,
  type TemplateDraft,
  type TemplateSaved,
  templateDraftOf,
  templateEdit,
} from '../../src/commerce/proposal-template-draft';
import {
  aboutRefusal,
  onPlatformTemplate,
  optionalSectionsShown,
  phaseRefusals,
  templateChanged,
  templatePartOrigin,
  templateSendable,
  templateWritesOf,
  termsRefusal,
} from '../../src/commerce/proposal-template-page';
import { richTextParagraphs } from '../../src/commerce/rich-text';
import { TIMELINE_PHASE_LIMIT } from '../../src/commerce/timeline-template-defaults';
import { edited, OWN, OWN_COVER, PLATFORM, phase } from './proposal-template-fixtures';

describe('whose each part is', () => {
  it("a part is HelioGrid's while it equals the platform's", () => {
    const draft = templateDraftOf(PLATFORM);

    for (const part of ['cover', 'sections', 'terms', 'timeline'] as const) {
      expect(templatePartOrigin(draft, part)).toBe('platform');
      expect(templatePartOrigin(templateDraftOf(OWN), part)).toBe('own');
    }
    expect(onPlatformTemplate(draft)).toBe(true);
    expect(onPlatformTemplate(edited(PLATFORM, { kind: 'section', section: 'system' }))).toBe(
      false,
    );
  });

  it('writing our own changes nothing until an edit', () => {
    const draft = edited(
      PLATFORM,
      { kind: 'writeOwn', part: 'terms' },
      { kind: 'writeOwn', part: 'terms' },
    );

    expect(draft.writing).toEqual(['terms']);
    expect(templatePartOrigin(draft, 'terms')).toBe('own');
    expect(templateChanged(PLATFORM, draft)).toEqual({ template: false, timeline: false });
    expect(templateWritesOf(PLATFORM, draft)).toEqual({});
  });

  it('a cover holding nothing is the platform’s again', () => {
    const draft = edited(
      PLATFORM,
      { kind: 'count', count: 'happyCustomers', value: 620 },
      { kind: 'count', count: 'happyCustomers', value: null },
    );

    expect(draft.template.cover).toBeNull();
    expect(templatePartOrigin(draft, 'cover')).toBe('platform');
  });
});

describe('the cover', () => {
  it('an about text is set per language, and a cleared Hindi falls back to English', () => {
    const draft = edited(
      OWN,
      { kind: 'about', language: 'hi', text: ' 2011 से पुणे में ' },
      { kind: 'about', language: 'hi', text: '' },
    );

    expect(draft.template.cover?.aboutCompany).toEqual({
      en: 'Rooftop solar across Pune since 2011.',
    });
    expect(
      edited(OWN, { kind: 'about', language: 'hi', text: 'पुणे' }).template.cover?.aboutCompany,
    ).toEqual({
      en: 'Rooftop solar across Pune since 2011.',
      hi: 'पुणे',
    });
  });

  it.each([
    ['English cleared while Hindi holds words', [{ en: '', hi: 'पुणे' }], 'needs-english'],
    ['English written', [{ en: 'Pune' }], null],
  ] as const)('the about field: %s', (_case, [about], refusal) => {
    const draft: TemplateDraft = {
      ...templateDraftOf(OWN),
      template: {
        ...OWN.template,
        cover: { ...OWN_COVER, aboutCompany: about },
      },
    };

    expect(aboutRefusal(draft)).toBe(refusal);
  });

  it('a first about text makes the cover the tenant’s', () => {
    const draft = edited(PLATFORM, { kind: 'about', language: 'en', text: 'Pune since 2011.' });

    expect(draft.template.cover).toEqual({
      aboutCompany: { en: 'Pune since 2011.' },
      totalCapacityInstalledKw: null,
      happyCustomers: null,
      citiesServed: null,
    });
    expect(templatePartOrigin(draft, 'cover')).toBe('own');
  });

  it('clearing every language of the about text leaves no about text', () => {
    const draft = edited(OWN, { kind: 'about', language: 'en', text: '  ' });

    expect(draft.template.cover?.aboutCompany).toBeNull();
    expect(aboutRefusal(draft)).toBeNull();
    expect(aboutRefusal(templateDraftOf(PLATFORM))).toBeNull();
  });
});

describe('the sections', () => {
  it('the terms always stay in the set', () => {
    const off = edited(OWN, { kind: 'section', section: 'terms' });
    const back = edited(OWN, { kind: 'section', section: 'performance' });

    expect(off.template.sectionsIncluded).toContain('terms');
    expect(back.template.sectionsIncluded).toEqual(
      DEFAULT_SECTIONS_INCLUDED.filter((section) => section !== 'components'),
    );
  });

  it.each([
    [DEFAULT_SECTIONS_INCLUDED, 8],
    [['terms'] as ProposalSection[], 0],
    [OWN.template.sectionsIncluded, 6],
  ])('counts the optional sections that print: %j → %i of 8', (sections, printing) => {
    const draft: TemplateDraft = {
      ...templateDraftOf(OWN),
      template: { ...OWN.template, sectionsIncluded: sections },
    };

    expect(optionalSectionsShown(draft)).toEqual({ printing, of: 8 });
  });
});

describe('the terms', () => {
  it('English terms cannot be empty', () => {
    const blank = edited(OWN, { kind: 'terms', language: 'en', value: richTextParagraphs(['  ']) });

    expect(termsRefusal(blank)).toBe('needs-english');
    expect(templateSendable(blank)).toBe(false);
    expect(termsRefusal(templateDraftOf(OWN))).toBeNull();
  });

  it('a language’s terms are set, and cleared back to English', () => {
    const hindi = richTextParagraphs(['30 दिन मान्य।']);
    const set = edited(OWN, { kind: 'terms', language: 'hi', value: hindi });

    expect(set.template.defaultTerms.hi).toEqual(hindi);
    expect(
      templateEdit(set, { kind: 'terms', language: 'hi', value: { version: 1, blocks: [] } })
        .template.defaultTerms,
    ).toEqual(OWN.template.defaultTerms);
  });

  it.each([
    ['a paragraph with words', richTextParagraphs(['Valid']), true],
    ['a blank paragraph', richTextParagraphs([' ']), false],
    [
      'a list with an item',
      { version: 1, blocks: [{ type: 'ul', items: [[{ text: 'One' }]] }] },
      true,
    ],
    ['a logo alone', { version: 1, blocks: [{ type: 'logo' }] }, false],
    ['nothing', undefined, false],
  ] as const)('holds words: %s', (_case, value, words) => {
    expect(hasWords(value)).toBe(words);
  });
});

describe('the phases', () => {
  it.each([
    ['120 characters', 120, null],
    ['121 characters', 121, 'too-long'],
  ] as const)('a phase name of %s', (_case, length, refusal) => {
    expect(phaseRefusals(phase('x'.repeat(length))).name).toBe(refusal);
  });

  it('a phase needs an English name and description', () => {
    expect(phaseRefusals(phase('', ' '))).toEqual({
      name: 'needs-english',
      description: 'needs-english',
    });
    expect(phaseRefusals(phase('Installation'))).toEqual({ name: null, description: null });

    const nameless = edited(OWN, { kind: 'phase', key: 0, phase: phase(' ') });
    expect(templateSendable(nameless)).toBe(false);
  });

  it('words of spaces count as no words in a language', () => {
    const spaced = phaseWithText(
      phaseWithText(EMPTY_PHASE, 'name', 'en', 'Installation'),
      'name',
      'hi',
      '   ',
    );

    expect(spaced.name).toEqual({ en: 'Installation' });
  });

  it('an about text keeps its spaces while it is typed', () => {
    const typing = edited(OWN, { kind: 'about', language: 'en', text: 'Pune since ' });

    expect(typing.template.cover?.aboutCompany?.en).toBe('Pune since ');
  });

  it('the phase editor types one language at a time', () => {
    const named = phaseWithText(EMPTY_PHASE, 'name', 'en', 'Installation');
    const hindi = phaseWithText(named, 'name', 'hi', 'स्थापना');

    expect(hindi.name).toEqual({ en: 'Installation', hi: 'स्थापना' });
    expect(phaseWithText(hindi, 'name', 'hi', '').name).toEqual({ en: 'Installation' });
    expect(phaseWithText(named, 'name', 'en', '').name).toEqual({ en: '' });
  });

  it('adds at the end, edits in place, moves and deletes by key', () => {
    const added = edited(OWN, { kind: 'phase', key: null, phase: phase('Handover') });
    const renamed = templateEdit(added, { kind: 'phase', key: 3, phase: phase('Hand-over') });
    const moved = templateEdit(renamed, { kind: 'move', from: 2, to: 1 });
    const deleted = templateEdit(moved, { kind: 'delete', key: 0 });

    expect(deleted.phases.map(({ key, name }) => [key, name.en])).toEqual([
      [2, 'Material dispatch'],
      [1, 'DISCOM application'],
      [3, 'Hand-over'],
    ]);
  });

  it.each([
    ['a move from outside the list', { from: 9, to: 0 }],
    ['a move above the first', { from: 0, to: -1 }],
    ['a move below the last', { from: 2, to: 3 }],
  ])('leaves the list as it is: %s', (_case, move) => {
    const draft = templateDraftOf(OWN);

    expect(templateEdit(draft, { kind: 'move', ...move }).phases).toBe(draft.phases);
  });

  it('a timeline holds up to twenty phases', () => {
    const full: TemplateSaved = {
      ...OWN,
      phases: Array.from({ length: TIMELINE_PHASE_LIMIT }, (_, n) => phase(`Phase ${n + 1}`)),
    };
    const one: TemplateSaved = { ...OWN, phases: [phase('Installation')] };

    expect(
      edited(full, { kind: 'phase', key: null, phase: phase('One more') }).phases,
    ).toHaveLength(20);
    expect(templateSendable(templateDraftOf(full))).toBe(true);
    expect(edited(one, { kind: 'delete', key: 0 }).phases).toHaveLength(1);
    expect(templateSendable({ ...templateDraftOf(one), phases: [] })).toBe(false);
  });
});
