'use client';
import type { ProposalDetail } from '@heliogrid/contracts';
import { onlineManager, type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { queryKeys } from '../cache/keys';
import type { Repositories } from '../data-layer';
import { useRepositories } from './context';
import { proposalCacheOf } from './proposal-cache';
import { type DraftAct, ProposalDraftQueue } from './proposal-draft-queue';
import { useTenantId } from './use-tenant-id';

/**
 * One save queue per proposal, per query client — never a process global, so a server render or a
 * test never meets another's queue. The builder's fields, the generation fill and Generate each
 * reach the SAME queue through their own hook, which is what keeps one revision moving in order.
 */
const QUEUES = new WeakMap<QueryClient, Map<string, ProposalDraftQueue>>();

function sendOf(repositories: Repositories, proposalId: string) {
  return (act: DraftAct, on: ProposalDetail) => {
    const stamp = { revision: on.revision, capturedAt: new Date().toISOString() };
    switch (act.kind) {
      case 'edit':
        return repositories.proposals.edit(proposalId, {
          ...stamp,
          fields: act.change.fields?.(on.document.fields),
          deal: act.change.deal,
          quickMode: act.change.quickMode,
        });
      case 'energy':
        return repositories.proposals.fillEnergy(proposalId, { ...stamp, mode: act.mode });
      case 'reset':
        return repositories.proposals.resetStep(proposalId, { ...stamp, step: act.step });
    }
  };
}

/** The proposal's one save queue, made on first use and dropped once it is idle and unread. */
export function useProposalDraftQueue(proposalId: string): ProposalDraftQueue {
  const queryClient = useQueryClient();
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const queue = useMemo(() => {
    const queues = QUEUES.get(queryClient) ?? new Map<string, ProposalDraftQueue>();
    QUEUES.set(queryClient, queues);
    const key = `${tenantId}/${proposalId}`;
    const held = queues.get(key);
    if (held !== undefined) return held;
    const cache = proposalCacheOf(queryClient, tenantId);
    const made = new ProposalDraftQueue({
      held: () => cache.held(proposalId),
      send: (act, on) => {
        // A detail read already out answers from before this commit: it is stopped, never let land.
        void queryClient.cancelQueries({
          queryKey: queryKeys.proposals.detail(tenantId, proposalId),
          exact: true,
        });
        return sendOf(repositories, proposalId)(act, on);
      },
      landed: cache.landed,
      online: () => onlineManager.isOnline(),
    });
    queues.set(key, made);
    return made;
  }, [queryClient, repositories, tenantId, proposalId]);
  useEffect(
    () => () => {
      const queues = QUEUES.get(queryClient);
      const key = `${tenantId}/${proposalId}`;
      // Read on the next tick: a remount subscribes again before then, and keeps its queue.
      queueMicrotask(() => {
        if (queues?.get(key) === queue && queue.disposable) queues.delete(key);
      });
    },
    [queryClient, tenantId, proposalId, queue],
  );
  return queue;
}
