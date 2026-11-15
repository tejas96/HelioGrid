import type { ProposalDocument } from '@heliogrid/contracts';
import { useProposalMarketNames, useProposalReaderDocument } from '@heliogrid/data/react';
import { proposalDocumentReadWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { type ProposalReaderDocument, useFormat } from '@heliogrid/ui';

/**
 * A document as the page parts draw it on the phone, in the reader's language:
 * `useProposalReaderDocument` over the company's market names. `null` while a draft has no price
 * typed or the names are out.
 */
export function useProposalPages(document: ProposalDocument | null): ProposalReaderDocument | null {
  const t = useTranslate();
  const format = useFormat();
  const { taxName } = useProposalMarketNames();
  return useProposalReaderDocument({ document }, format, taxName, (input) =>
    proposalDocumentReadWords(t, { ...input, format }),
  );
}
