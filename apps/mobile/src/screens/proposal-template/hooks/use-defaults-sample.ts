import {
  defaultsSampleSource,
  type ProposalTemplateScreen,
  useProposalMarketNames,
  useProposalReaderDocument,
} from '@heliogrid/data/react';
import { proposalDocumentReadWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { type DefaultsSample, useFormat } from '@heliogrid/ui';

/**
 * The sample document as the phone's page parts draw it, in the reader's language:
 * `defaultsSampleSource` through `useProposalReaderDocument`; `null` until the page and the
 * market's names are read.
 */
export function useDefaultsSample(screen: ProposalTemplateScreen): DefaultsSample | null {
  const t = useTranslate();
  const format = useFormat();
  const { taxName } = useProposalMarketNames();
  const source = defaultsSampleSource(screen, format.date(new Date()));
  return useProposalReaderDocument(source, format, taxName, (input) =>
    proposalDocumentReadWords(t, { ...input, format }),
  );
}
