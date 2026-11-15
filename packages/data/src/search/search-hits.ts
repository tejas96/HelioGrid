import type { SearchResults } from '@heliogrid/contracts';
import { PROPOSAL_STANDINGS, type ProposalStanding, type SearchHits } from '@heliogrid/domain';

const KNOWN_STANDINGS: ReadonlySet<string> = new Set(PROPOSAL_STANDINGS);

function isKnownStanding(standing: string): standing is ProposalStanding {
  return KNOWN_STANDINGS.has(standing);
}

/**
 * The one search's answer as the view reads it (`F6-20`). An api built before proposals answers no
 * proposals group, which reads as a group that found nothing. A proposal whose standing this build
 * does not know cannot be worded, so it is left out of the rows and the count rather than drawn
 * under a wrong word (`extensibleEnum`: a reader keeps a fallback).
 */
export function searchHitsOf(results: SearchResults): SearchHits {
  const sent = results.proposals ?? { items: [], total: 0 };
  const items = sent.items.flatMap((proposal) =>
    isKnownStanding(proposal.standing) ? [{ ...proposal, standing: proposal.standing }] : [],
  );
  return {
    ...results,
    proposals: { items, total: sent.total - (sent.items.length - items.length) },
  };
}
