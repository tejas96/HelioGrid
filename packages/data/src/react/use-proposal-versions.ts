'use client';
import type { ProposalVersion, ProposalVersionSummary } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf, recordReadOf } from './read';
import { type MadeFileRead, useMadeFile } from './use-made-file';
import { useTenantId } from './use-tenant-id';

/**
 * A proposal's versions (`SCR-M06-16`, `M06-42`): every one, newest first, each as it was
 * generated; the one opened, frozen, with what moved since the version before; and that version's
 * PDF, made on first ask and looked for again while it is made (`M06-51`).
 */
export interface ProposalVersions {
  /** Empty for a draft never generated. */
  readonly list: Read<readonly ProposalVersionSummary[]>;
  /** The version asked for; `null` when none is. */
  readonly version: Exclude<Read<ProposalVersion>, { readonly kind: 'empty' }> | null;
  /** The opened version's PDF: nothing is read until its `ask`. */
  readonly pdf: MadeFileRead;
}

export function useProposalVersions(proposalId: string, opened: number | null): ProposalVersions {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const ready = tenantId !== '' && proposalId !== '';
  const list = useQuery({
    queryKey: queryKeys.proposals.versions(tenantId, proposalId),
    queryFn: ({ signal }) => repositories.proposals.versions(proposalId, signal),
    enabled: ready,
  });
  const version = useQuery({
    queryKey: queryKeys.proposals.version(tenantId, proposalId, opened ?? 0),
    queryFn: ({ signal }) => repositories.proposals.version(proposalId, opened ?? 0, signal),
    enabled: ready && opened !== null,
    // A version is frozen (`M06-43`): once read, it never needs reading again in this session.
    staleTime: Number.POSITIVE_INFINITY,
  });
  const pdf = useMadeFile(
    queryKeys.proposals.versionPdf(tenantId, proposalId, opened ?? 0),
    (signal) => repositories.proposals.versionPdf(proposalId, opened ?? 0, signal),
    ready && opened !== null,
  );
  return {
    list: readOf(list, (versions) => versions.length === 0),
    version: opened === null ? null : recordReadOf(version),
    pdf,
  };
}
