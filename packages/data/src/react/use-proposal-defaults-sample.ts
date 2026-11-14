'use client';
import { useProposalMarketNames } from './use-proposal-market-names';
import {
  type ProposalReaderDocumentRead,
  type ProposalReaderFormat,
  type ProposalReaderWordsInput,
  useProposalReaderDocument,
} from './use-proposal-reader-document';
import type { ProposalTemplateScreen } from './use-proposal-template-screen';

/**
 * Proposal defaults' sample document, as both apps draw it (`T-M01-030`): the screen's snapshot —
 * the company's defaults over the sample deal — dated today, with the company's logo and cover
 * photo, through `useProposalReaderDocument`. The words are the caller's (`architecture.md` §2).
 * `null` until the page and the market's names are read.
 */
export function useProposalDefaultsSample<W>(
  screen: ProposalTemplateScreen,
  format: ProposalReaderFormat,
  words: (input: ProposalReaderWordsInput) => W,
): ProposalReaderDocumentRead<W> | null {
  const { taxName } = useProposalMarketNames();
  const logoSrc = screen.page.cover?.logoSrc;
  const coverSrc = screen.coverPhoto.picture;
  const facts = {
    dateText: format.date(new Date().toISOString()),
    generationTier: 'estimated',
    ...(logoSrc === undefined ? {} : { logoSrc }),
    ...(coverSrc === null ? {} : { coverSrc }),
  } as const;
  return useProposalReaderDocument({ sample: screen.sample, facts }, format, taxName, words);
}
