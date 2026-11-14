import type { LeadProposals } from '@heliogrid/contracts';
import type { LeadProposal } from './LeadSections.types';

/** Which of its five states the Proposals section draws (`T-M06-001`). */
export type LeadProposalsState = 'closed' | 'none' | 'collision' | 'list';

/** The proposals still live on the lead: two of them is the collision a person must end (`M06-58`). */
export function liveProposals(section: LeadProposals): readonly LeadProposal[] {
  return section.items.filter((proposal) => proposal.live);
}

export function leadProposalsState(section: LeadProposals, closed: boolean): LeadProposalsState {
  if (closed) return 'closed';
  if (section.items.length === 0) return 'none';
  return liveProposals(section).length > 1 ? 'collision' : 'list';
}

/** A draft that was never generated: it shows its ring and Continue, never a number. */
export function isUnfinishedDraft(proposal: LeadProposal): boolean {
  return proposal.standing === 'draft' && proposal.number === null;
}

/** How far a draft is, 0 to 1, for its ring. */
export function draftShare(proposal: LeadProposal): number {
  const { complete, of } = proposal.progress;
  return of > 0 ? Math.min(1, complete / of) : 0;
}
