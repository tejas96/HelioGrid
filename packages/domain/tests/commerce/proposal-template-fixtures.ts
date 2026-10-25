import {
  DEFAULT_SECTIONS_INCLUDED,
  DEFAULT_TERMS,
} from '../../src/commerce/proposal-template-defaults';
import {
  type TemplateEdit,
  type TemplateSaved,
  templateDraftOf,
  templateEdit,
} from '../../src/commerce/proposal-template-draft';
import { richTextParagraphs } from '../../src/commerce/rich-text';
import {
  DEFAULT_TIMELINE_PHASES,
  type TimelinePhase,
} from '../../src/commerce/timeline-template-defaults';

/** The two companies the Proposal template's tests read: one on the platform's template, one with its own. */
export const PLATFORM: TemplateSaved = {
  template: {
    cover: null,
    sectionsIncluded: DEFAULT_SECTIONS_INCLUDED,
    defaultTerms: DEFAULT_TERMS,
  },
  phases: DEFAULT_TIMELINE_PHASES,
};

export const phase = (name: string, description = `${name}, explained.`): TimelinePhase => ({
  name: { en: name },
  description: { en: description },
});

export const OWN_COVER = {
  aboutCompany: { en: 'Rooftop solar across Pune since 2011.' },
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
    defaultTerms: { en: richTextParagraphs(['Valid for 30 days.']) },
  },
  phases: [
    phase('Site survey and design'),
    phase('DISCOM application'),
    phase('Material dispatch'),
  ],
};

export const edited = (saved: TemplateSaved, ...edits: TemplateEdit[]) =>
  edits.reduce(templateEdit, templateDraftOf(saved));
