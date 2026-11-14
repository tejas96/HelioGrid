'use client';
import type { ProposalDocument } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { MadeFileRead } from './use-made-file';
import { type ProposalRead, useProposal } from './use-proposal';
import { useProposalVersions } from './use-proposal-versions';

/** Where the reader leads and what the device does for it. */
export interface ProposalReaderMoves {
  /** The builder, where a change makes the next version. */
  toBuilder(proposalId: string): void;
  /** The track screen with its share sheet open. */
  toShare(proposalId: string): void;
  openFile(url: string): void;
}

export interface ProposalReaderScreen {
  readonly proposal: ProposalRead;
  /** The version read, or — for a draft never generated — the draft's live document. */
  readonly read: Exclude<Read<ProposalDocument>, { readonly kind: 'empty' }>;
  /** The version shown; `null` while a draft's live document is. */
  readonly version: number | null;
  readonly pdf: MadeFileRead;
  /** The act that is out. */
  readonly pending: 'pdf' | null;
  /** Absent for a reader who may not: the act is then not drawn. */
  readonly newVersion: (() => void) | null;
  readonly share: (() => void) | null;
  getPdf(): void;
  /**
   * The read as the reader draws it: the document turned into its pages by the app (its words are
   * the app's), still out while that is — a draft with no price typed has no pages to draw yet.
   */
  drawn<Pages>(pages: Pages | null): Exclude<Read<Pages>, { readonly kind: 'empty' }>;
}

/**
 * The document reader (`SCR-M06-17`, `T-M06-015`): one version's frozen pages — the newest unless
 * the address names another — drawn by the same parts the customer's link and the PDF use.
 */
export function useProposalReaderScreen(
  proposalId: string,
  asked: number | null,
  moves: ProposalReaderMoves,
): ProposalReaderScreen {
  const proposal = useProposal(proposalId);
  const detail = proposal.kind === 'ready' ? proposal.value : null;
  const version = asked ?? detail?.versions[0]?.version ?? null;
  const versions = useProposalVersions(proposalId, version);
  const { file } = versions.pdf;

  const read = documentRead(proposal, version, versions.version);
  return {
    proposal,
    read,
    drawn: (pages) => {
      if (read.kind !== 'ready') return read;
      return pages === null ? { kind: 'loading' } : { kind: 'ready', value: pages };
    },
    version,
    pdf: versions.pdf,
    pending: file.kind === 'making' ? 'pdf' : null,
    newVersion: detail?.rights.edit === true ? () => moves.toBuilder(proposalId) : null,
    share:
      detail?.rights.share === true && version !== null ? () => moves.toShare(proposalId) : null,
    getPdf: () => {
      if (version !== null) versions.pdf.get(moves.openFile);
    },
  };
}

/**
 * The document a version shows: that version's, frozen, once it is read; a draft never generated
 * (`version` null) shows its own live document. The reader and the track screen both read it here.
 */
export function documentRead(
  proposal: ProposalRead,
  version: number | null,
  read: ReturnType<typeof useProposalVersions>['version'],
): ProposalReaderScreen['read'] {
  if (proposal.kind !== 'ready') return proposal;
  if (version === null) return { kind: 'ready', value: proposal.value.document };
  if (read === null || read.kind === 'loading') return { kind: 'loading' };
  if (read.kind === 'failed') return read;
  return { kind: 'ready', value: read.value.document };
}
