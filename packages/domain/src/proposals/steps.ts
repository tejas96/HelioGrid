import type { ProposalSection } from '../commerce/proposal-template-defaults';

/**
 * The eleven steps (`M06-07`…`M06-17`), in their reading order, by stable keys: a step's number is
 * its place in this list, never stored. Step order is a default reading order, not a wall — any
 * step is reachable in any state (`M06-22`).
 */
export const PROPOSAL_STEPS = [
  'company',
  'achievements',
  'system',
  'performance',
  'financials',
  'timeline',
  'payment',
  'components',
  'terms',
  'client',
  'bank',
] as const;
export type ProposalStep = (typeof PROPOSAL_STEPS)[number];

/** A step's number as people read it: 1 to 11. */
export function stepNumberOf(step: ProposalStep): number {
  return PROPOSAL_STEPS.indexOf(step) + 1;
}

/**
 * Quick mode shows only these four (`M06-18`) — product law, never stored: steps 4 and 5 are
 * filled for the person and 6, 7, 9 and 11 carry the company's defaults.
 */
export const QUICK_STEPS: readonly ProposalStep[] = ['company', 'system', 'components', 'client'];

/** The steps a builder presents: all eleven, or Quick mode's four. */
export function presentedSteps(quickMode: boolean): readonly ProposalStep[] {
  return quickMode ? QUICK_STEPS : PROPOSAL_STEPS;
}

/**
 * How a step stands on the rail (`T-M06-002`): done, filled from the company's defaults, or still
 * to do — each a mark and a word, never a colour alone, and none of them blocks navigation.
 */
export const STEP_STANDINGS = ['done', 'default', 'to_do'] as const;
export type StepStanding = (typeof STEP_STANDINGS)[number];

/**
 * The document's nine pages in print order (`T-M06-017`). A page number is its place among the
 * pages that print, counted again when one is left out.
 */
export const PROPOSAL_PAGES = [
  'cover',
  'about',
  'system',
  'generation',
  'savings',
  'price',
  'timeline',
  'terms',
  'bank',
] as const;
export type ProposalPage = (typeof PROPOSAL_PAGES)[number];

/** The cover, the price page and the terms always print (`T-M06-017`, `T-M01-030`). */
export const PAGES_ALWAYS_PRINTED: readonly ProposalPage[] = ['cover', 'price', 'terms'];

/**
 * The company's section setting each other page follows (`M01-51`): the one stored choice, read by
 * page — never a second "pages off" list beside it. The price page holds the system price and the
 * payment plan, so those two sections always print with it.
 */
const PAGE_SECTION: Readonly<
  Record<Exclude<ProposalPage, 'cover' | 'price' | 'terms'>, ProposalSection>
> = {
  about: 'achievements',
  system: 'components',
  generation: 'performance',
  savings: 'financials',
  timeline: 'timeline',
  bank: 'bank_details',
};

/** The section a page's switch stores, or `null` for a page with no switch. */
export function sectionOfPage(page: ProposalPage): ProposalSection | null {
  return page === 'cover' || page === 'price' || page === 'terms' ? null : PAGE_SECTION[page];
}

/** Whether a page may be switched off in Proposal defaults. */
export function isPageOptional(page: ProposalPage): boolean {
  return sectionOfPage(page) !== null;
}

/**
 * The pages a document prints, in order (`T-M06-017`): the three that always print, and each other
 * page whose section the company includes. A page left out is left out of the document and the
 * customer link alike; its builder step stays.
 */
export function pagesPrinted(
  sectionsIncluded: readonly ProposalSection[],
): readonly ProposalPage[] {
  return PROPOSAL_PAGES.filter((page) => {
    const section = sectionOfPage(page);
    return section === null || sectionsIncluded.includes(section);
  });
}

/** The page the desktop stage shows beside a step (`T-M06-002`): the page that step feeds. */
export const STEP_PAGE: Readonly<Record<ProposalStep, ProposalPage>> = {
  company: 'cover',
  achievements: 'about',
  system: 'price',
  performance: 'generation',
  financials: 'savings',
  timeline: 'timeline',
  payment: 'price',
  components: 'system',
  terms: 'terms',
  client: 'cover',
  bank: 'bank',
};
