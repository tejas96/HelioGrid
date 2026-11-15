'use client';
import type { ProposalDocument } from '@heliogrid/contracts';
import {
  type FormatPack,
  type ProposalVersionSnapshot,
  type UiLanguage,
  uiLanguageOfTag,
} from '@heliogrid/domain';
import { useMemo } from 'react';
import {
  type ProposalPageFactsRead,
  proposalPageFactsOf,
  proposalSnapshotOf,
} from '../proposals/document-snapshot';
import type { ProposalTemplateScreen } from './use-proposal-template-screen';

/** What a reader is drawn from: a version's document as the server sent it, or a made-up sample. */
export type ProposalReaderSource =
  | { readonly document: ProposalDocument | null }
  | { readonly sample: ProposalVersionSnapshot | null; readonly facts: ProposalPageFactsRead };

/** The market's format a reader needs here: its pack, and the day in its style. */
export interface ProposalReaderFormat {
  readonly pack: FormatPack;
  date(value: string): string;
}

/** What the words are built over: the snapshot, its version, and the market's tax name. */
export interface ProposalReaderWordsInput {
  readonly snapshot: ProposalVersionSnapshot;
  readonly version: number | null;
  readonly taxName: string;
}

/** A document as the page parts draw it: its snapshot, the facts beside it, and its words. */
export interface ProposalReaderDocumentRead<W> {
  readonly snapshot: ProposalVersionSnapshot;
  readonly facts: ProposalPageFactsRead;
  readonly words: W;
}

/**
 * The ONE way a snapshot becomes pages (`F5-38`: the proposal has one renderer): the document
 * screen, the track, the customer's link, the printer's page and the defaults' sample all read it
 * here, on both apps. The words come from the caller — this package may not import `i18n`
 * (`architecture.md` §2) — as `proposalDocumentReadWords` over the input handed to `words`.
 * `null` while a draft has no price typed (no money block exists to draw) or while the market's
 * tax name is still out.
 */
export function useProposalReaderDocument<W>(
  source: ProposalReaderSource,
  format: ProposalReaderFormat,
  taxName: string | null,
  words: (input: ProposalReaderWordsInput) => W,
): ProposalReaderDocumentRead<W> | null {
  const document = 'document' in source ? source.document : null;
  const { pack, date } = format;
  const read = useMemo(() => {
    if (document === null) return null;
    const snapshot = proposalSnapshotOf(document, pack);
    return snapshot === null ? null : { snapshot, facts: proposalPageFactsOf(document, date) };
  }, [document, pack, date]);
  const drawn = 'sample' in source ? sampleRead(source) : read;
  if (drawn === null || taxName === null) return null;
  const version = 'document' in source ? (source.document?.version ?? null) : null;
  return { ...drawn, words: words({ snapshot: drawn.snapshot, version, taxName }) };
}

function sampleRead(source: {
  readonly sample: ProposalVersionSnapshot | null;
  readonly facts: ProposalPageFactsRead;
}) {
  return source.sample === null ? null : { snapshot: source.sample, facts: source.facts };
}

/**
 * The language a document is read in, before its words are built — what the reader's mount
 * follows; `null` while there is no document, or for a language this app does not know.
 */
export function proposalReaderLanguage(document: ProposalDocument | null): UiLanguage | null {
  return document === null ? null : uiLanguageOfTag(document.language);
}

/**
 * Proposal defaults' sample as a reader draws it: the company's defaults over the sample deal,
 * dated `dateText` (today, in the reader's words), its logo and cover as the page holds them.
 */
export function defaultsSampleSource(
  screen: Pick<ProposalTemplateScreen, 'sample' | 'page' | 'coverPhoto'>,
  dateText: string,
): ProposalReaderSource {
  const logoSrc = screen.page.cover?.logoSrc;
  const coverSrc = screen.coverPhoto.picture;
  return {
    sample: screen.sample,
    facts: {
      dateText,
      generationTier: 'estimated',
      ...(logoSrc === undefined ? {} : { logoSrc }),
      ...(coverSrc === null ? {} : { coverSrc }),
    },
  };
}
