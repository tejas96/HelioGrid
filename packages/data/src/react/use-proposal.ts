'use client';
import type { ProposalDetail } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { newerOf } from './proposal-cache';
import { recordReadOf } from './read';
import { useTenantId } from './use-tenant-id';

/** One proposal as its screens read it — never empty: it answers, or it is not found. */
export type ProposalRead = Exclude<Read<ProposalDetail>, { readonly kind: 'empty' }>;

/**
 * The ONE read of a proposal (`SCR-M06-02`…`SCR-M06-19`): the builder, the check, the track screen
 * and the document all draw from it, so no two of them can show different facts. Every act writes
 * its own answer here (`proposal-cache.ts`), so the figures on screen are always the server's last.
 * `null` reads nothing — a route whose id has not arrived yet.
 */
export function useProposal(proposalId: string | null): ProposalRead {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const query = useQuery({
    queryKey: queryKeys.proposals.detail(tenantId, proposalId ?? ''),
    queryFn: ({ signal }) => repositories.proposals.detail(proposalId ?? '', signal),
    enabled: tenantId !== '' && proposalId !== null,
    structuralSharing: (held, next) =>
      newerOf(held as ProposalDetail | undefined, next as ProposalDetail),
  });
  return recordReadOf(query);
}
