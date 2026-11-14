'use client';
import type { ProposalDetail, ProposalRow } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { type ProposalActFailure, proposalActFailureOf, useProposalCache } from './proposal-cache';
import { readOf } from './read';
import { useTenantId } from './use-tenant-id';

/** How many of the reader's own proposals *Same as {customer}* offers. */
const RECENT_OFFERED = 5;

/** Where a new draft starts: on which lead, in which mode, or as a copy of an earlier proposal. */
export interface StartAsk {
  readonly leadId: string;
  readonly quickMode: boolean;
  /** *Same as {customer}* and *Copy for another lead* (`M06-48`); `null` starts empty. */
  readonly copyOf: string | null;
}

/** The draft a start opened: just made, or the lead's open one found again (`T-M06-001`). */
export interface StartedDraft {
  readonly proposal: ProposalDetail;
  readonly resumed: boolean;
}

/**
 * The entry sheet's data (`SCR-M06-01`, `M06-05`, `M06-48`): the reader's own recent proposals to
 * start *Same as*, read only while the sheet is open, and the start itself — one key per ask, so a
 * second tap after a dropped answer opens the draft the first made. A lead holds one open draft:
 * starting on it again resumes that one.
 */
export interface ProposalStart {
  /** The reader's latest proposals, newest first; empty when they have made none. */
  readonly recent: Read<readonly ProposalRow[]>;
  start(ask: StartAsk): void;
  readonly starting: boolean;
  readonly started: StartedDraft | null;
  /** A closed lead answers `refused` with domain's reason — *Reopen the lead to make a proposal*. */
  readonly failure: ProposalActFailure | null;
  clear(): void;
}

export function useProposalStart(open: boolean): ProposalStart {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const cache = useProposalCache();
  const [started, setStarted] = useState<StartedDraft | null>(null);
  /* One submission keeps its moment, so the same ask sent again carries the same retry key. */
  const held = useRef<{ readonly ask: string; readonly capturedAt: string } | null>(null);
  const recentAsk = { mine: 'true', filter: 'all', limit: RECENT_OFFERED, page: 1 } as const;
  const recent = useQuery({
    queryKey: queryKeys.proposals.list(tenantId, recentAsk),
    queryFn: async ({ signal }) =>
      (await repositories.proposals.list(recentAsk, signal)).rows.items,
    enabled: tenantId !== '' && open,
  });
  const send = useAction(
    ({ leadId, quickMode, copyOf }: StartAsk) => {
      const ask = JSON.stringify({ leadId, quickMode, copyOf });
      if (held.current?.ask !== ask) held.current = { ask, capturedAt: new Date().toISOString() };
      return repositories.proposals.start(leadId, {
        quickMode,
        copyOf,
        capturedAt: held.current.capturedAt,
      });
    },
    {
      onDone: (made) => {
        held.current = null;
        setStarted(made);
        cache.landed(made.proposal);
      },
    },
  );
  return {
    recent: readOf(recent, (rows) => rows.length === 0),
    start: (ask) => void send.run(ask),
    starting: send.pending,
    started,
    failure: send.failure === null ? null : proposalActFailureOf(send.failure),
    clear: () => {
      held.current = null;
      setStarted(null);
      send.clear();
    },
  };
}
