import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECTIONS_INCLUDED,
  type ProposalSection,
} from '../../src/commerce/proposal-template-defaults';
import {
  hasWords,
  type TemplateDraft,
  type TemplateSaved,
  templateDraftOf,
  templateEdit,
} from '../../src/commerce/proposal-template-draft';
import {
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
import { DEFAULTS, edited, OWN, PLATFORM, phase } from './proposal-template-fixtures';

describe('whose each part is', () => {
  it("a part is HelioGrid's while it equals the platform's", () => {
    const draft = templateDraftOf(PLATFORM);

    for (const part of ['cover', 'sections', 'terms', 'timeline'] as const) {
      expect(templatePartOrigin(draft, part, DEFAULTS)).toBe('platform');
      expect(templatePartOrigin(templateDraftOf(OWN), part, DEFAULTS)).toBe('own');
    }
    expect(onPlatformTemplate(draft, DEFAULTS)).toBe(true);
    expect(
      onPlatformTemplate(edited(PLATFORM, { kind: 'section', section: 'system' }), DEFAULTS),
    ).toBe(false);
  });

  it.each([
    ['the defaults it was read with', DEFAULTS, 'platform'],
    [
      'defaults in other words',
      { terms: richTextParagraphs(['यह प्रस्ताव मान्य है।']), phases: [phase('स्थापना')] },
      'own',
    ],
  ] as const)('terms and phases are judged against %s', (_case, defaults, origin) => {
    const draft = templateDraftOf(PLATFORM);

    expect(templatePartOrigin(draft, 'terms', defaults)).toBe(origin);
    expect(templatePartOrigin(draft, 'timeline', defaults)).toBe(origin);
  });

  it('writing our own changes nothing until an edit', () => {
    const draft = edited(
      PLATFORM,
      { kind: 'writeOwn', part: 'terms' },
      { kind: 'writeOwn', part: 'terms' },
    );

    expect(draft.writing).toEqual(['terms']);
    expect(templatePartOrigin(draft, 'terms', DEFAULTS)).toBe('own');
    expect(templateChanged(PLATFORM, draft)).toEqual({ template: false, timeline: false });
    expect(templateWritesOf(PLATFORM, draft)).toEqual({});
  });

  it.each([
    [
      'a count set and cleared',
      [
        { kind: 'count', count: 'happyCustomers', value: 620 },
        { kind: 'count', count: 'happyCustomers', value: null },
      ],
    ],
    [
      'an about text written and cleared',
      [
        { kind: 'about', text: 'Pune since 2011.' },
        { kind: 'about', text: '' },
      ],
    ],
  ] as const)('a cover holding nothing is the platform’s again: %s', (_case, edits) => {
    const draft = edited(PLATFORM, ...edits);

    expect(draft.template.cover).toBeNull();
    expect(templatePartOrigin(draft, 'cover', DEFAULTS)).toBe('platform');
  });
});

describe('the cover', () => {
  it.each([
    ['words', 'Pune since 2011.', 'Pune since 2011.'],
    ['words still being typed, spaces kept', 'Pune since ', 'Pune since '],
    ['spaces alone', '   ', null],
    ['nothing', '', null],
  ] as const)('an about text of %s is held as %j', (_case, text, held) => {
    expect(edited(OWN, { kind: 'about', text }).template.cover?.aboutCompany).toBe(held);
  });

  it('a first about text makes the cover the tenant’s', () => {
    const draft = edited(PLATFORM, { kind: 'about', text: 'Pune since 2011.' });

    expect(draft.template.cover).toEqual({
      aboutCompany: 'Pune since 2011.',
      totalCapacityInstalledKw: null,
      happyCustomers: null,
      citiesServed: null,
    });
    expect(templatePartOrigin(draft, 'cover', DEFAULTS)).toBe('own');
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
  it.each([
    ['a paragraph with words', richTextParagraphs(['Valid for 30 days.']), null],
    ['a blank paragraph', richTextParagraphs(['  ']), 'empty'],
    ['no blocks', { version: 1, blocks: [] }, 'empty'],
  ] as const)('terms of %s', (_case, value, refusal) => {
    const draft = edited(OWN, { kind: 'terms', value });

    expect(termsRefusal(draft)).toBe(refusal);
    expect(templateSendable(draft)).toBe(refusal === null);
  });

  it('terms with no words are held as an empty body', () => {
    const blank = edited(OWN, { kind: 'terms', value: richTextParagraphs(['  ']) });

    expect(blank.template.defaultTerms).toEqual({ version: 1, blocks: [] });
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
    ['a name', phase('Installation'), { name: null, description: null }],
    ['an empty name', phase(''), { name: 'empty', description: null }],
    ['a name of spaces', phase('   '), { name: 'empty', description: null }],
    ['a name of 120 characters', phase('x'.repeat(120)), { name: null, description: null }],
    ['a name of 121 characters', phase('x'.repeat(121)), { name: 'too-long', description: null }],
    ['a sentence of spaces', phase('Installation', ' '), { name: null, description: 'empty' }],
  ] as const)('a phase with %s', (_case, held, refusals) => {
    expect(phaseRefusals(held)).toEqual(refusals);
  });

  it('a phase with no name keeps the template from being sent', () => {
    expect(templateSendable(edited(OWN, { kind: 'phase', key: 0, phase: phase(' ') }))).toBe(false);
  });

  it('adds at the end, edits in place, moves and deletes by key', () => {
    const added = edited(OWN, { kind: 'phase', key: null, phase: phase('Handover') });
    const renamed = templateEdit(added, { kind: 'phase', key: 3, phase: phase('Hand-over') });
    const moved = templateEdit(renamed, { kind: 'move', from: 2, to: 1 });
    const deleted = templateEdit(moved, { kind: 'delete', key: 0 });

    expect(deleted.phases.map(({ key, name }) => [key, name])).toEqual([
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
