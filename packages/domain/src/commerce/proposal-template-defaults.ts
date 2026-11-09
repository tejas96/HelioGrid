/**
 * The sections a proposal document carries (`M01-51`): the builder's content steps (`M06-08`
 * to `M06-17`), in document order. Company and client identity are not sections — a document
 * always says who it is from and for.
 */
export const PROPOSAL_SECTIONS = [
  'achievements',
  'system',
  'performance',
  'financials',
  'timeline',
  'payment_terms',
  'components',
  'terms',
  'bank_details',
] as const;
export type ProposalSection = (typeof PROPOSAL_SECTIONS)[number];

/**
 * Terms print on every proposal — whether they print is not a setting (`SCR-M01-19`, decision 4).
 * Every other section is the tenant's choice.
 */
export const SECTION_FLOOR: readonly ProposalSection[] = ['terms'];

export function isSectionFloor(section: ProposalSection): boolean {
  return SECTION_FLOOR.includes(section);
}

/**
 * The set a tenant chose, made whole: the floor is always in, the order is the document's, and a
 * section named twice counts once. The save and the effective read both pass through here.
 */
export function sectionsIncluded(chosen: readonly ProposalSection[]): readonly ProposalSection[] {
  return PROPOSAL_SECTIONS.filter((section) => chosen.includes(section) || isSectionFloor(section));
}

/** Every section, by default (`M01-28`): a first proposal is complete, never sparse. */
export const DEFAULT_SECTIONS_INCLUDED: readonly ProposalSection[] = PROPOSAL_SECTIONS;

/**
 * The cover's achievements block (`M06-08`): what the tenant says about itself, and three counts
 * the cover prints with their units added. Each is the tenant's own declaration, absent by
 * default: a cover with no achievements shows identity alone, never a sample figure. Only the kW
 * figure carries a tier, `estimated · declared by you`; the two counts carry none (`F8-01`).
 */
export interface ProposalCover {
  /** The tenant's own words about itself — one value, shown as written (`F3-10`). */
  readonly aboutCompany: string | null;
  readonly totalCapacityInstalledKw: number | null;
  readonly happyCustomers: number | null;
  readonly citiesServed: number | null;
}
