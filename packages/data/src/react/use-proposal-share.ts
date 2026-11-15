'use client';
import type { ComposedMessage } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import type { ShareProposal } from '../proposals/proposals-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import { type ProposalActFailure, proposalActFailureOf, useProposalCache } from './proposal-cache';
import { recordReadOf } from './read';
import { useTenantId } from './use-tenant-id';

type MessageRead = Exclude<Read<ComposedMessage>, { readonly kind: 'empty' }>;

/** Which of the share's two acts the tap was (`M06-53`). */
export type ShareChannel = ShareProposal['channel'];

/** What a share answered: the words with the link in them, and the follow-up it raised or moved. */
export interface SharedOut {
  readonly message: ComposedMessage;
  /** The day the follow-up on the lead's owner falls (`M06-55`). */
  /** `null` where the share raised no follow-up. */
  readonly followUpOn: string | null;
}

/** Which of the proposal's sheets is open: each reads its words only while it is. */
export interface ShareSheets {
  readonly share: boolean;
  readonly acceptance: boolean;
}

/**
 * Share, withdraw and the words a person sends (`SCR-M06-18`, `M06-53`, `M06-58`, `F5-48`). The
 * share is a person's tap, marked AFTER the hand-off — never a delivery — and the first one mints
 * the customer's link; a later one reuses it. The words are the server's, in the customer's
 * language.
 */
export interface ProposalShare {
  /** The share sheet's words before the tap; before the first share they hold the link's slot. */
  readonly message: MessageRead | null;
  /** Marks the latest version shared through `channel`. A second press while one is out sends nothing. */
  share(channel: ShareChannel): void;
  readonly sharing: boolean;
  /** What the last share answered, until `clear`. */
  readonly shared: SharedOut | null;
  /** Withdraws the proposal: its link then says it is no longer active. */
  withdraw(): void;
  readonly withdrawing: boolean;
  readonly withdrawn: boolean;
  /** Discards a draft that was never generated — a generated proposal is withdrawn instead. */
  discard(): void;
  readonly discarding: boolean;
  readonly discarded: boolean;
  /** The thank-you after an Accept — a courtesy; the customer's page already shows the acceptance. */
  readonly acceptance: MessageRead | null;
  /** Why the last share, withdraw or discard did not land; its `refused` reason is domain's. */
  readonly failure: ProposalActFailure | null;
  clear(): void;
}

export function useProposalShare(proposalId: string, sheets: ShareSheets): ProposalShare {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const cache = useProposalCache();
  const [shared, setShared] = useState<SharedOut | null>(null);
  const [withdrawn, setWithdrawn] = useState(false);
  const ready = tenantId !== '' && proposalId !== '';
  const message = useQuery({
    queryKey: queryKeys.proposals.shareMessage(tenantId, proposalId),
    queryFn: ({ signal }) => repositories.proposals.shareMessage(proposalId, signal),
    enabled: ready && sheets.share,
  });
  const acceptance = useQuery({
    queryKey: queryKeys.proposals.acceptanceMessage(tenantId, proposalId),
    queryFn: ({ signal }) => repositories.proposals.acceptanceMessage(proposalId, signal),
    enabled: ready && sheets.acceptance,
  });
  const share = useAction(
    (channel: ShareChannel) =>
      repositories.proposals.share(proposalId, { channel, capturedAt: new Date().toISOString() }),
    {
      onDone: (out) => {
        setShared({ message: out.message, followUpOn: out.followUpOn });
        cache.moved(out.proposal);
      },
    },
  );
  const withdraw = useAction(
    () => repositories.proposals.withdraw(proposalId, new Date().toISOString()),
    {
      onDone: (proposal) => {
        setWithdrawn(true);
        cache.moved(proposal);
      },
    },
  );
  const [discarded, setDiscarded] = useState(false);
  const discard = useAction(
    () => repositories.proposals.discard(proposalId, new Date().toISOString()),
    {
      onDone: () => {
        const leadId = cache.held(proposalId)?.lead.id;
        setDiscarded(true);
        if (leadId !== undefined) cache.gone(proposalId, leadId);
      },
    },
  );
  const failed = share.failure ?? withdraw.failure ?? discard.failure;
  const clearActs = () => {
    share.clear();
    withdraw.clear();
    discard.clear();
  };
  return {
    message: sheets.share ? recordReadOf(message) : null,
    share: (channel) => {
      clearActs();
      void share.run(channel);
    },
    sharing: share.pending,
    shared,
    withdraw: () => {
      clearActs();
      void withdraw.run(undefined);
    },
    withdrawing: withdraw.pending,
    withdrawn,
    discard: () => {
      clearActs();
      void discard.run(undefined);
    },
    discarding: discard.pending,
    discarded,
    acceptance: sheets.acceptance ? recordReadOf(acceptance) : null,
    failure: failed === null ? null : proposalActFailureOf(failed),
    clear: () => {
      setShared(null);
      setWithdrawn(false);
      setDiscarded(false);
      clearActs();
    },
  };
}
