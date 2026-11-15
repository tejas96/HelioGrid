import type { ProposalPage } from '../proposals/steps';
import type { TemplatePart } from './proposal-template-draft';

/**
 * Proposal defaults' seven parts (`T-M01-030`, `SCR-M01-19`), in the order its rail shows them:
 * what every new proposal starts with. Each part feeds one page of the document, which the stage
 * shows beside it; *Pages* feeds them all, so its stage is the wall of every page.
 */
export const DEFAULTS_PARTS = [
  'look',
  'record',
  'pages',
  'timeline',
  'payment',
  'terms',
  'bank',
] as const;
export type DefaultsPart = (typeof DEFAULTS_PARTS)[number];

/** The page a part feeds; `null` for *Pages*, whose stage is every page at once. */
export const DEFAULTS_PART_PAGE: Readonly<Record<DefaultsPart, ProposalPage | null>> = {
  look: 'cover',
  record: 'about',
  pages: null,
  timeline: 'timeline',
  payment: 'price',
  terms: 'terms',
  bank: 'bank',
};

/** The part that holds a record's field — where a refused save opens, so its reason is in view. */
export const DEFAULTS_PART_OF: Readonly<Record<TemplatePart, DefaultsPart>> = {
  cover: 'record',
  sections: 'pages',
  terms: 'terms',
  timeline: 'timeline',
};

/** The About text's bound (`M06-08`): what the cover's story may hold. */
export const ABOUT_COMPANY_LIMIT = 2000;
