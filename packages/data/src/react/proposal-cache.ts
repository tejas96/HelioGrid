'use client';
import type { ProposalDetail } from '@heliogrid/contracts';
import type { TransportFailure } from '@heliogrid/domain';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError, type ApiErrorDetail, DataError } from '../errors/errors';
import {
  ProposalActRefusedError,
  ProposalConflictError,
  ProposalNotReadyError,
} from '../proposals/proposal-refusals';
import { useTenantId } from './use-tenant-id';

const CHANGED_ELSEWHERE = 'PROPOSAL_CHANGED_ELSEWHERE';
const LEAD_MOVED = 'PROPOSAL_LEAD_MOVED';
const ENTITLEMENT_BLOCKED = 'ENTITLEMENT_BLOCKED';

/** Who a lead moved to, for *This lead moved to {person}* (`T-M06-023`). */
export interface MovedTo {
  readonly userId: string;
  readonly name: string;
}

/**
 * Why an act on a proposal did not land, from what the client threw — one reading for every
 * proposal hook, so each screen says the same thing for the same refusal (`F4-16`).
 */
export type ProposalActFailure =
  /** The status machine or the lead's state does not allow it; domain's reason, as sent. */
  | { readonly kind: 'refused'; readonly refusal: string }
  /** Another device changed the draft first: reload, nothing was overwritten (`M06-25`). */
  | { readonly kind: 'changed_elsewhere' }
  /** The lead was given to someone else; the draft stays with the lead. */
  | { readonly kind: 'lead_moved'; readonly to: MovedTo | null }
  /** The billing gate refused it: the app's one denial says why (`M12-21`), so no second line. */
  | { readonly kind: 'billing' }
  /** No answer, or an answer no rule here names: the transport's reason, else the server's code. */
  | {
      readonly kind: 'failed';
      readonly failure: TransportFailure | null;
      readonly code: string | null;
      readonly message: string;
      readonly details: readonly ApiErrorDetail[];
    };

export function proposalActFailureOf(error: unknown): ProposalActFailure {
  if (error instanceof ProposalConflictError) {
    return error.code === LEAD_MOVED
      ? { kind: 'lead_moved', to: error.movedTo }
      : { kind: 'changed_elsewhere' };
  }
  if (error instanceof ProposalActRefusedError) return { kind: 'refused', refusal: error.refusal };
  if (error instanceof ApiError && error.code === ENTITLEMENT_BLOCKED) return { kind: 'billing' };
  return {
    kind: 'failed',
    failure: error instanceof DataError ? error.failure : 'unreadable_answer',
    code: error instanceof ApiError ? error.code : null,
    message: error instanceof Error ? error.message : '',
    details: error instanceof ApiError ? (error.details ?? []) : [],
  };
}

/** The codes a conflict carries, for a caller that tells the two apart before mapping. */
export const PROPOSAL_CONFLICT = { CHANGED_ELSEWHERE, LEAD_MOVED } as const;

export { ProposalNotReadyError };

/** How every act on a proposal lands in the cache: its own answer first, then what it moved. */
export interface ProposalCache {
  /** The detail as held now — what the next commit's revision is read from. */
  held(proposalId: string): ProposalDetail | undefined;
  /**
   * The proposal an act answered with. Its lists, its lead's page and what hangs off it are asked
   * again; the detail itself is not, since the answer IS the detail.
   */
  landed(proposal: ProposalDetail): void;
  /** An act that moved what the customer sees or the forecast counts: a share, an answer, Won. */
  moved(proposal: ProposalDetail): void;
  /** A proposal that is gone — a discarded draft. */
  gone(proposalId: string, leadId: string): void;
  /** Reads the detail again from the server. */
  reread(proposalId: string): Promise<void>;
}

/**
 * The detail to hold of two: an answer never puts an older revision back over a newer one — a read
 * out across a commit would make the next commit carry a stale revision and be refused as changed
 * on another device. An equal revision takes the later answer: a share moves the status alone.
 */
export function newerOf(held: ProposalDetail | undefined, next: ProposalDetail): ProposalDetail {
  return held !== undefined && held.revision > next.revision ? held : next;
}

/** The cache writes of a proposal act, bound to one query client and one company. */
export function proposalCacheOf(queryClient: QueryClient, tenantId: string): ProposalCache {
  const detailKey = (id: string) => queryKeys.proposals.detail(tenantId, id);
  const around = (proposalId: string, leadId: string) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.proposals.lists(tenantId) });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.proposals.about(tenantId, proposalId),
    });
    // The lead's page shows the proposals section and the draft's "n/11" (`M06-25`).
    void queryClient.invalidateQueries({ queryKey: queryKeys.crm.lead(tenantId, leadId) });
  };
  const landed = (proposal: ProposalDetail) => {
    queryClient.setQueryData<ProposalDetail>(detailKey(proposal.id), (held) =>
      newerOf(held, proposal),
    );
    around(proposal.id, proposal.lead.id);
  };
  return {
    held: (proposalId) => queryClient.getQueryData<ProposalDetail>(detailKey(proposalId)),
    landed,
    moved: (proposal) => {
      landed(proposal);
      const leadId = proposal.lead.id;
      void queryClient.invalidateQueries({ queryKey: queryKeys.proposals.links(tenantId, leadId) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.proposals.wonBasis(tenantId, leadId),
      });
      // The lead's stage follows a share by itself (`M06-45`), and the pipeline its value.
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.owner(tenantId) });
    },
    gone: (proposalId, leadId) => {
      queryClient.removeQueries({ queryKey: detailKey(proposalId) });
      around(proposalId, leadId);
    },
    reread: (proposalId) => queryClient.invalidateQueries({ queryKey: detailKey(proposalId) }),
  };
}

export function useProposalCache(): ProposalCache {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMemo(() => proposalCacheOf(queryClient, tenantId), [queryClient, tenantId]);
}
