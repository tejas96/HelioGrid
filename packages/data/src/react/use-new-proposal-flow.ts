'use client';
import type { LeadSummary, ProposalRow } from '@heliogrid/contracts';
import type { DealSegment, Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import type { ProposalActFailure } from './proposal-cache';
import { readOf } from './read';
import { useProposalStart } from './use-proposal-start';
import { type ProposalStartSheetState, useProposalStartSheet } from './use-proposal-start-sheet';
import { useTenantId } from './use-tenant-id';

/** Where a started proposal opens: the builder. */
export interface NewProposalMoves {
  toBuilder(proposalId: string): void;
}

/**
 * What stands over the list: quick add for a new customer, the picker a copy starts from, or the
 * start sheet on the lead the capture gave.
 */
export type NewProposalStage = 'capture' | 'pick' | 'start';

export interface NewProposalFlow {
  readonly stage: NewProposalStage | null;
  /** The proposal being copied for another lead (`M06-48`); `null` on a plain New proposal. */
  readonly copyOf: ProposalRow | null;
  /** *New proposal*: quick add opens first, so every proposal hangs on a lead (`M06-05`). */
  openNew(): void;
  /** *Copy for another lead*: the picker opens first. */
  openCopy(row: ProposalRow): void;
  /** Every way out with nothing started; refused while a start is out. */
  close(): void;
  readonly picker: {
    readonly query: string;
    setQuery(query: string): void;
    /** The reader's leads, newest first, narrowed by the query. */
    readonly leads: Read<readonly LeadSummary[]>;
    /** The lead whose proposal is being started. */
    readonly pendingId: string | null;
    pick(leadId: string): void;
    /** *A new customer*: the capture, with the copy still in hand. */
    newCustomer(): void;
  };
  /**
   * The lead quick add saved, or the existing lead it was pointed at. A plain New proposal opens
   * the start sheet on it, Quick picked first on a home lead and Full on any other — the lead's own
   * kind decides, the capture's only until the lead is read; a copy starts at once, bringing its
   * source's own mode.
   */
  startOn(leadId: string, segment: DealSegment | null): void;
  /** The start sheet over the list, open at stage `start`. */
  readonly start: ProposalStartSheetState;
  /** The customer's name the start sheet's copy line greets; `null` until the lead is read. */
  readonly customerName: string | null;
  /** The lead's segment — a business is greeted by its whole name. */
  readonly customerSegment: DealSegment | null;
  readonly starting: boolean;
  readonly failure: ProposalActFailure | null;
}

const PICKER_PAGE = 20;

/**
 * *New proposal* and *Copy for another lead* on the proposals list (`T-M06-001`, `T-M06-019`): a
 * lead first — captured, or picked — then start-or-resume on it, and the builder opens on what the
 * server answered. Closing the capture creates neither a lead nor a proposal.
 */
export function useNewProposalFlow(moves: NewProposalMoves): NewProposalFlow {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const [stage, setStage] = useState<NewProposalStage | null>(null);
  const [copyOf, setCopyOf] = useState<ProposalRow | null>(null);
  const [query, setQuery] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const start = useProposalStart(false);
  const [captured, setCaptured] = useState<{
    readonly leadId: string;
    readonly segment: DealSegment | null;
  } | null>(null);
  const capturedLead = useQuery({
    queryKey: queryKeys.crm.lead(tenantId, captured?.leadId ?? ''),
    queryFn: ({ signal }) => repositories.leads.detail(captured?.leadId ?? '', signal),
    enabled: tenantId !== '' && captured !== null,
  });
  const segment = capturedLead.data?.lead.segment ?? captured?.segment ?? null;
  const q = query.trim();
  const ask = { limit: PICKER_PAGE, page: 1, ...(q === '' ? {} : { q }) };
  const leads = useQuery({
    queryKey: queryKeys.crm.leads(tenantId, ask),
    queryFn: ({ signal }) => repositories.leads.list(ask, signal),
    enabled: tenantId !== '' && stage === 'pick',
    select: (list) => list.items,
  });
  const latestMoves = useRef(moves);
  latestMoves.current = moves;
  const sheet = useProposalStartSheet(
    captured?.leadId ?? null,
    segment === 'residential',
    (proposalId) => {
      setStage(null);
      setCaptured(null);
      latestMoves.current.toBuilder(proposalId);
    },
  );
  const clear = useRef(start.clear);
  clear.current = start.clear;
  const { started } = start;
  useEffect(() => {
    if (started === null) return;
    setStage(null);
    setCopyOf(null);
    setPendingId(null);
    clear.current();
    latestMoves.current.toBuilder(started.proposal.id);
  }, [started]);

  const startOn = (leadId: string, kind: DealSegment | null) => {
    if (copyOf === null) {
      setCaptured({ leadId, segment: kind });
      setStage('start');
      sheet.show();
      return;
    }
    setPendingId(leadId);
    start.start({
      leadId,
      quickMode: false,
      copyOf: copyOf.id,
    });
  };
  const rows = leads.data;
  return {
    stage,
    copyOf,
    openNew: () => {
      start.clear();
      setCopyOf(null);
      setStage('capture');
    },
    openCopy: (row) => {
      start.clear();
      setCopyOf(row);
      setQuery('');
      setStage('pick');
    },
    close: () => {
      if (start.starting || sheet.sheet.starting) return;
      setStage(null);
      setCopyOf(null);
      setPendingId(null);
      setCaptured(null);
    },
    picker: {
      query,
      setQuery,
      leads: readOf(leads),
      pendingId: start.starting ? pendingId : null,
      pick: (leadId) => startOn(leadId, rows?.find((lead) => lead.id === leadId)?.segment ?? null),
      newCustomer: () => setStage('capture'),
    },
    startOn,
    start: {
      ...sheet.sheet,
      open: stage === 'start' && sheet.sheet.open,
      close: () => {
        if (sheet.sheet.starting) return;
        sheet.sheet.close();
        setStage(null);
        setCaptured(null);
      },
    },
    customerName: capturedLead.data?.lead.name ?? null,
    customerSegment: segment,
    starting: start.starting,
    failure: start.failure,
  };
}
