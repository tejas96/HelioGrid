import type { Translator } from '../runtime';
import { proposalStartSources, proposalStartWords } from './proposal-builder-flow';
import { type ProposalActFailureLike, proposalActFailureWords } from './proposal-screens-words';

type T = Translator['t'];

/**
 * The start sheet in words (`T-M06-001`), wherever it opens — the lead and *New proposal* on both
 * platforms: its own words over the customer's name, the recent proposals it can copy, and why a
 * start was refused.
 */
export function proposalStartSheetSaid(
  t: T,
  formats: Parameters<typeof proposalStartSources>[1],
  facts: {
    readonly name: string;
    readonly segment: Parameters<typeof proposalStartWords>[1]['segment'];
    readonly recent: Parameters<typeof proposalStartSources>[2];
    readonly failure: ProposalActFailureLike | null;
  },
) {
  return {
    words: proposalStartWords(t, { name: facts.name, segment: facts.segment }),
    sources: proposalStartSources(t, formats, facts.recent),
    failure: proposalActFailureWords(t, facts.failure),
  };
}
