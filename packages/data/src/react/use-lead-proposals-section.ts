'use client';
import type { LeadDetail, LeadProposals } from '@heliogrid/contracts';
import { isClosedState } from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import type { ProposalActFailure } from './proposal-cache';
import { useProposalShare } from './use-proposal-share';
import { type ProposalStartSheetState, useProposalStartSheet } from './use-proposal-start-sheet';
import { useTenantId } from './use-tenant-id';

/** Where the lead's proposals lead. */
export interface LeadProposalsMoves {
  toBuilder(proposalId: string): void;
  toProposal(proposalId: string): void;
  toLead(leadId: string): void;
}

export type { LeadStartMode } from './use-proposal-start-sheet';

export interface LeadProposalsSection {
  /** The section as the server sends it; absent on an api built before proposals. */
  readonly section: LeadProposals | null;
  /** The lead is lost, disqualified or junk: no proposal is made on it until it is reopened. */
  readonly closed: boolean;
  /** *Create proposal*: the draft that is open is resumed, else the start sheet opens. */
  create(): void;
  continueDraft(proposalId: string): void;
  open(proposalId: string): void;
  openSibling(): void;
  /** The start sheet (`T-M06-001`): Quick or Full, or the same as a recent proposal. */
  readonly start: ProposalStartSheetState;
  /** *Withdraw* on one of two proposals (`M06-58`): the sheet's proposal, the send and its answer. */
  readonly withdraw: {
    readonly proposalId: string | null;
    ask(proposalId: string): void;
    close(): void;
    confirm(): void;
    readonly sending: boolean;
    readonly failure: ProposalActFailure | null;
  };
}

/**
 * The lead's Proposals section (`T-M06-001`, `T-M06-031`): none, a draft, one proposal, two with
 * the warning, or a closed lead. A home lead starts in Quick mode and any other in Full; one tap
 * changes it (owner ruling 2026-11-13).
 */
export function useLeadProposalsSection(
  leadId: string,
  lead: LeadDetail | null,
  moves: LeadProposalsMoves,
): LeadProposalsSection {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const section = lead?.proposals ?? null;
  const homeLead = lead?.lead.segment === 'residential';
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const start = useProposalStartSheet(leadId, homeLead, moves.toBuilder);
  const withdraw = useProposalShare(withdrawId ?? '', { share: false, acceptance: false });

  const { withdrawn } = withdraw;
  const clearWithdraw = useRef(withdraw.clear);
  clearWithdraw.current = withdraw.clear;
  useEffect(() => {
    if (!withdrawn) return;
    setWithdrawId(null);
    clearWithdraw.current();
    // The section is the lead's own read: it is asked again once one proposal is withdrawn.
    void queryClient.invalidateQueries({ queryKey: queryKeys.crm.lead(tenantId, leadId) });
  }, [withdrawn, queryClient, tenantId, leadId]);

  const draft = section?.items.find((item) => item.number === null && item.live) ?? null;
  return {
    section,
    closed: lead !== null && isClosedState(lead.lead.state),
    create: () => {
      if (draft !== null) {
        moves.toBuilder(draft.id);
        return;
      }
      start.show();
    },
    continueDraft: moves.toBuilder,
    open: moves.toProposal,
    openSibling: () => {
      if (section?.sibling != null) moves.toLead(section.sibling.leadId);
    },
    start: start.sheet,
    withdraw: {
      proposalId: withdrawId,
      ask: (proposalId) => {
        withdraw.clear();
        setWithdrawId(proposalId);
      },
      close: () => {
        if (withdraw.withdrawing) return;
        setWithdrawId(null);
      },
      confirm: withdraw.withdraw,
      sending: withdraw.withdrawing,
      failure: withdraw.failure,
    },
  };
}
