import type { ProposalDocument } from '@heliogrid/contracts';
import type { ProvenanceTier } from '@heliogrid/domain';

/** What a page prints that is not in the snapshot: the number, the date as text, the pictures. */
export interface ProposalPageFactsRead {
  readonly number?: string;
  readonly dateText: string;
  readonly logoSrc?: string;
  readonly coverSrc?: string;
  readonly generationTier: ProvenanceTier;
}

/** `date` writes the day in the market's style and the reader's words (`useFormat().date`). */
export function proposalPageFactsOf(
  document: ProposalDocument,
  date: (value: string) => string,
): ProposalPageFactsRead {
  return {
    ...(document.number === null ? {} : { number: document.number }),
    dateText: date(document.date),
    ...(document.company.logoUrl === null ? {} : { logoSrc: document.company.logoUrl }),
    ...(document.company.coverPhotoUrl === null
      ? {}
      : { coverSrc: document.company.coverPhotoUrl }),
    generationTier: document.generation?.tier ?? 'estimated',
  };
}
