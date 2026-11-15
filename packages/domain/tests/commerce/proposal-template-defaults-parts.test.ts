import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECTIONS_INCLUDED,
  type ProposalSection,
} from '../../src/commerce/proposal-template-defaults';
import { templateDraftOf, templateEdit } from '../../src/commerce/proposal-template-draft';
import {
  DEFAULTS_PART_OF,
  DEFAULTS_PART_PAGE,
  DEFAULTS_PARTS,
} from '../../src/commerce/proposal-template-parts';
import { templateSampleSnapshot } from '../../src/commerce/proposal-template-sample';
import { IN_FORMATS } from '../../src/format/pack';
import { PAGES_ALWAYS_PRINTED, PROPOSAL_PAGES } from '../../src/proposals/steps';

const PHASES = [
  { name: 'Site visit', description: 'We measure the roof.' },
  { name: 'Installation', description: 'A trained crew fits the system.' },
];

const SAVED = {
  template: {
    cover: null,
    sectionsIncluded: DEFAULT_SECTIONS_INCLUDED,
    defaultTerms: { version: 1 as const, blocks: [] },
  },
  phases: PHASES,
};

const sample = (sections: readonly ProposalSection[], incentiveScheme: string | null) =>
  templateSampleSnapshot({
    formats: IN_FORMATS,
    company: {
      name: 'Suryodaya Solar',
      phoneE164: null,
      email: null,
      website: null,
      address: null,
      logoFileId: null,
      taxRegistration: null,
      bankDetails: null,
      brandColour: null,
    },
    cover: null,
    coverPicture: { kind: 'platform', key: 'villa' },
    sectionsIncluded: sections,
    terms: { version: 1, blocks: [] },
    validityDays: null,
    phases: PHASES,
    tranches: [],
    incentiveScheme,
    customer: { name: 'Anil Sharma', siteAddress: 'Kothrud, Pune', area: '', district: 'Pune' },
    preparedBy: { name: 'Rahul Patil', phoneE164: null },
    language: 'en',
  });

describe('Proposal defaults — its seven parts (T-M01-030)', () => {
  it('every part but Pages feeds one page; Pages feeds the wall', () => {
    const walls = DEFAULTS_PARTS.filter((part) => DEFAULTS_PART_PAGE[part] === null);
    expect(walls).toEqual(['pages']);
    for (const part of DEFAULTS_PARTS) {
      const page = DEFAULTS_PART_PAGE[part];
      if (page !== null) expect(PROPOSAL_PAGES).toContain(page);
    }
  });

  it('a refused record opens the part that holds its field', () => {
    expect(DEFAULTS_PART_OF.terms).toBe('terms');
    expect(DEFAULTS_PART_OF.cover).toBe('record');
    expect(DEFAULTS_PART_OF.sections).toBe('pages');
  });
});

describe('templateEdit — the cover picture and the whole timeline (T-M01-030)', () => {
  it('a picture chosen is held on the template, and the phases stay', () => {
    const draft = templateEdit(templateDraftOf(SAVED), {
      kind: 'coverPicture',
      picture: { kind: 'own', fileId: 'file-1' },
    });
    expect(draft.template.coverPicture).toEqual({ kind: 'own', fileId: 'file-1' });
    expect(draft.phases).toHaveLength(PHASES.length);
  });

  it('Reset replaces every phase and keys them afresh', () => {
    const platform = [{ name: 'Order', description: 'We book your system.' }];
    const draft = templateEdit(templateDraftOf(SAVED), { kind: 'phases', phases: platform });
    expect(draft.phases).toEqual([{ ...platform[0], key: 0 }]);
  });
});

describe('templateSampleSnapshot — the company’s defaults over the sample deal (T-M01-030)', () => {
  it.each([
    ['every section', DEFAULT_SECTIONS_INCLUDED, PROPOSAL_PAGES],
    ['only the floor', ['terms'] as const, PAGES_ALWAYS_PRINTED],
  ])('%s prints its pages, the three that always print among them', (_, sections, pages) => {
    expect(sample(sections, 'PM Surya Ghar').pages).toEqual(pages);
  });

  it('states no part amounts: a device works out no money (F4-04)', () => {
    expect(sample(DEFAULT_SECTIONS_INCLUDED, 'PM Surya Ghar').money.tranches).toBeNull();
  });

  it.each([
    ['a market with an incentive', 'PM Surya Ghar', true],
    ['a market with none', null, false],
  ])('%s: the incentive is named only where the market offers one', (_, scheme, offered) => {
    const { money } = sample(DEFAULT_SECTIONS_INCLUDED, scheme);
    expect(money.incentiveOffered).toBe(offered);
    expect(money.incentive === null).toBe(!offered);
    expect(money.netCost < money.payable).toBe(offered);
  });

  it('prints the company’s own picture, timeline and plan over the sample', () => {
    const snapshot = sample(DEFAULT_SECTIONS_INCLUDED, null);
    expect(snapshot.fields.company.coverPicture).toEqual({ kind: 'platform', key: 'villa' });
    expect(snapshot.fields.timeline.map((phase) => phase.name)).toEqual([
      'Site visit',
      'Installation',
    ]);
    expect(snapshot.fields.timeline.every((phase) => phase.durationDays === null)).toBe(true);
  });
});
