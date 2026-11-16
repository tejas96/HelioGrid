'use client';
import type { LeadSummary } from '@heliogrid/contracts';
import { bulkAssignReportOf, type InboxActReturn, type InboxActState } from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError, DataError } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';

/** Who a lead is given to, by id and the name the act's line says. */
export interface InboxAssignee {
  readonly userId: string;
  readonly name: string;
}

/** A bulk assign's one report: how many went to whom, and how many stayed, each naming its reason. */
export interface InboxBulkReport {
  readonly given: number;
  readonly refused: number;
  readonly name: string;
}

/**
 * What the last confirmed single act says in its toast: a lead given to someone, a lead binned —
 * with its way back — and how that way back went.
 */
export type InboxActNote =
  | { readonly kind: 'given'; readonly lead: LeadSummary; readonly name: string }
  | { readonly kind: 'junked' | 'restored' | 'undo-failed'; readonly lead: LeadSummary };

/** The inbox's acts and what they left that the next read does not hold yet (`M02-67`). */
export interface InboxActs {
  readonly settled: ReadonlySet<string>;
  readonly acts: ReadonlyMap<string, InboxActState>;
  readonly held: ReadonlyMap<string, LeadSummary>;
  /** The deck's lead that just left, flying off; null once the deck moves on. */
  readonly departed: LeadSummary | null;
  readonly bulkReport: InboxBulkReport | null;
  readonly note: InboxActNote | null;
  give(lead: LeadSummary, to: InboxAssignee): void;
  junk(lead: LeadSummary): void;
  giveAll(leads: readonly LeadSummary[], to: InboxAssignee): void;
  /** Sends a returned act again, as it was. */
  retry(lead: LeadSummary): void;
  /** Clears a returned act's line; the lead stays only while the read still lists it. */
  dismiss(leadId: string): void;
  dismissBulkReport(): void;
  /** Reopens the lead the last junk binned, back into the queue (`M02-56`). */
  undoJunk(): void;
  dismissNote(): void;
  clearDeparted(): void;
}

/**
 * Why an act came back undone, read off the failure (`F8-36`: no readable answer is unconfirmed).
 * A refusal keeps its code alone: the screen words it, never showing the server's English.
 */
export function inboxReturnOf(error: unknown): InboxActReturn {
  if (error instanceof ApiError && error.failure === null) {
    if (error.status === 404 || error.code === 'LEAD_TRANSITION_REFUSED')
      return { kind: 'unavailable' };
    if (error.code === 'ASSIGNEE_UNAVAILABLE') return { kind: 'assignee_unavailable' };
    return { kind: 'refused', code: error.code };
  }
  const failure = error instanceof DataError ? error.failure : null;
  return { kind: 'unanswered', failure: failure ?? 'unreadable_answer' };
}

/**
 * The two triage acts and the bulk assign, each completed by the server and never shown done
 * before it confirms (`M02-67`). A confirmed lead leaves at once and the CRM is read again; one
 * that comes back undone stays in its place, naming why, until its line is cleared. `isDeck`
 * says whether a lead is the deck's, so the one that leaves from there flies off.
 */
export function useLeadInboxActs(
  tenantId: string,
  isDeck: (leadId: string) => boolean,
  onLeft: (leadId: string) => void,
): InboxActs {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const [settled, setSettled] = useState<ReadonlySet<string>>(new Set());
  const [acts, setActs] = useState<ReadonlyMap<string, InboxActState>>(new Map());
  const [held, setHeld] = useState<ReadonlyMap<string, LeadSummary>>(new Map());
  const [departed, setDeparted] = useState<LeadSummary | null>(null);
  const [bulkReport, setBulkReport] = useState<InboxBulkReport | null>(null);
  const [note, setNote] = useState<InboxActNote | null>(null);
  /* The lead the last junk binned, held apart from its toast: a toast closes before its Undo runs. */
  const lastBinned = useRef<LeadSummary | null>(null);
  /* Read in the same frame as a tap: a lead whose act is out sends nothing more. */
  const out = useRef(new Set<string>());
  const latest = useRef({ isDeck, onLeft });
  latest.current = { isDeck, onLeft };

  const begin = (lead: LeadSummary, act: InboxActState) => {
    out.current.add(lead.id);
    setActs((now) => new Map(now).set(lead.id, act));
  };
  const settle = (lead: LeadSummary) => {
    out.current.delete(lead.id);
    if (latest.current.isDeck(lead.id)) setDeparted(lead);
    setSettled((now) => new Set(now).add(lead.id));
    setActs((now) => withoutKey(now, lead.id));
    setHeld((now) => withoutKey(now, lead.id));
    latest.current.onLeft(lead.id);
  };
  const giveBack = (lead: LeadSummary, act: InboxActState, why: InboxActReturn) => {
    out.current.delete(lead.id);
    setActs((now) => new Map(now).set(lead.id, { ...act, returned: why }));
    setHeld((now) => new Map(now).set(lead.id, lead));
  };
  /* Every act moves the queue, the loads and the lists at once: the CRM is read again whole. */
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });

  const assign = useAction(
    async ({ lead, to }: { lead: LeadSummary; to: InboxAssignee }) => {
      const act: InboxActState = { act: 'assign', assignee: to, returned: null };
      try {
        const outcome = await repositories.leadAssign.assign(lead.id, {
          assigneeId: to.userId,
          expectedOwnerId: null,
        });
        if (outcome.kind === 'assigned') {
          settle(lead);
          setNote({ kind: 'given', lead, name: to.name });
        } else giveBack(lead, act, { kind: 'taken', owner: outcome.owner?.name ?? null });
      } catch (error) {
        giveBack(lead, act, inboxReturnOf(error));
      }
      await refresh();
    },
    { key: ({ lead }) => lead.id },
  );

  const bin = useAction(
    async (lead: LeadSummary) => {
      try {
        await repositories.leadLifecycle.junk(lead.id, { capturedAt: new Date().toISOString() });
        settle(lead);
        lastBinned.current = lead;
        setNote({ kind: 'junked', lead });
      } catch (error) {
        giveBack(lead, { act: 'junk', assignee: null, returned: null }, inboxReturnOf(error));
      }
      await refresh();
    },
    { key: (lead) => lead.id },
  );

  const unbin = useAction(
    async (lead: LeadSummary) => {
      try {
        await repositories.leadLifecycle.reopen(lead.id, { capturedAt: new Date().toISOString() });
        // Back in the queue: the next read lists it again, so nothing here may hide it.
        setSettled((now) => without(now, lead.id));
        // It is in the queue again, so it no longer flies off the deck as well.
        setDeparted((now) => (now?.id === lead.id ? null : now));
        setNote({ kind: 'restored', lead });
      } catch {
        setNote({ kind: 'undo-failed', lead });
      }
      await refresh();
    },
    { key: (lead) => lead.id },
  );

  /* One function for the hook's life: a toast holds it, and a new one each render would remake the
     toast under the press that reaches for its Undo. */
  const unbinNow = useRef(unbin);
  unbinNow.current = unbin;
  const undoJunk = useCallback(() => {
    const lead = lastBinned.current;
    if (lead === null) return;
    lastBinned.current = null;
    void unbinNow.current.run(lead);
  }, []);

  const bulk = useAction(
    async ({ leads, to }: { leads: readonly LeadSummary[]; to: InboxAssignee }) => {
      const act: InboxActState = { act: 'assign', assignee: to, returned: null };
      try {
        const answer = await repositories.leadAssign.bulkAssign({
          leadIds: leads.map((lead) => lead.id),
          assigneeId: to.userId,
        });
        const report = bulkAssignReportOf(
          leads.map((lead) => lead.id),
          answer.results,
        );
        for (const lead of leads) {
          const why = report.returned.get(lead.id);
          if (why === undefined) settle(lead);
          else giveBack(lead, act, why);
        }
        setBulkReport({ given: report.given, refused: report.returned.size, name: to.name });
      } catch (error) {
        for (const lead of leads) giveBack(lead, act, inboxReturnOf(error));
      }
      await refresh();
    },
  );

  const giveOne = (lead: LeadSummary, to: InboxAssignee) => {
    if (out.current.has(lead.id)) return;
    begin(lead, { act: 'assign', assignee: to, returned: null });
    void assign.run({ lead, to });
  };
  const junkOne = (lead: LeadSummary) => {
    if (out.current.has(lead.id)) return;
    begin(lead, { act: 'junk', assignee: null, returned: null });
    void bin.run(lead);
  };

  return {
    settled,
    acts,
    held,
    departed,
    bulkReport,
    note,
    give: giveOne,
    junk: junkOne,
    giveAll: (leads, to) => {
      const free = leads.filter((lead) => !out.current.has(lead.id));
      if (free.length === 0 || bulk.isOut()) return;
      for (const lead of free) begin(lead, { act: 'assign', assignee: to, returned: null });
      setBulkReport(null);
      void bulk.run({ leads: free, to });
    },
    retry: (lead) => {
      const act = acts.get(lead.id);
      if (act === undefined || act.returned === null) return;
      if (act.assignee === null) junkOne(lead);
      else giveOne(lead, act.assignee);
    },
    dismiss: (leadId) => {
      if (out.current.has(leadId)) return;
      setActs((now) => withoutKey(now, leadId));
      setHeld((now) => withoutKey(now, leadId));
    },
    dismissBulkReport: () => setBulkReport(null),
    undoJunk,
    dismissNote: () => setNote(null),
    clearDeparted: () => setDeparted(null),
  };
}

/** The set without one member — the same set when it holds none. */
export function without(set: ReadonlySet<string>, key: string): ReadonlySet<string> {
  if (!set.has(key)) return set;
  const next = new Set(set);
  next.delete(key);
  return next;
}

function withoutKey<V>(map: ReadonlyMap<string, V>, key: string): ReadonlyMap<string, V> {
  if (!map.has(key)) return map;
  const next = new Map(map);
  next.delete(key);
  return next;
}
