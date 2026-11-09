import { DEFAULT_SECTIONS_INCLUDED } from '../../src/commerce/proposal-template-defaults';
import {
  type TemplateEdit,
  type TemplateSaved,
  templateDraftOf,
  templateEdit,
} from '../../src/commerce/proposal-template-draft';
import type { TemplateDefaults } from '../../src/commerce/proposal-template-page';
import { richTextParagraphs } from '../../src/commerce/rich-text';
import type { TimelinePhase } from '../../src/commerce/timeline-template-defaults';

export const phase = (name: string, description = `${name}, explained.`): TimelinePhase => ({
  name,
  description,
});

/** The platform's terms and phases as one reader's catalog words them (`documentDefaults`). */
export const DEFAULTS: TemplateDefaults = {
  terms: richTextParagraphs(['This proposal is valid until the date stated on it.']),
  phases: [phase('Material ordered'), phase('Installation'), phase('Handover')],
};

/** The two companies the Proposal template's tests read: one on the platform's template, one with its own. */
export const PLATFORM: TemplateSaved = {
  template: {
    cover: null,
    sectionsIncluded: DEFAULT_SECTIONS_INCLUDED,
    defaultTerms: DEFAULTS.terms,
  },
  phases: DEFAULTS.phases,
};

export const OWN_COVER = {
  aboutCompany: 'Rooftop solar across Pune since 2011.',
  totalCapacityInstalledKw: 1840,
  happyCustomers: 620,
  citiesServed: 14,
};

export const OWN: TemplateSaved = {
  template: {
    cover: OWN_COVER,
    sectionsIncluded: DEFAULT_SECTIONS_INCLUDED.filter(
      (section) => section !== 'performance' && section !== 'components',
    ),
    defaultTerms: richTextParagraphs(['Valid for 30 days.']),
  },
  phases: [
    phase('Site survey and design'),
    phase('DISCOM application'),
    phase('Material dispatch'),
  ],
};

export const edited = (saved: TemplateSaved, ...edits: TemplateEdit[]) =>
  edits.reduce(templateEdit, templateDraftOf(saved));
