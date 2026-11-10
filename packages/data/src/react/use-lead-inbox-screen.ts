'use client';
import type { Assignee, LeadInbox, LeadSummary } from '@heliogrid/contracts';
import {
  can,
  cursorStepped,
  type InboxCursor,
  type InboxView,
  inboxViewOf,
  isActOut,
  LEAD_SOURCES,
  type LeadSource,
  offersDoor,
  type Read,
  shellViewFor,
} from '@heliogrid/domain';
import { type InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { type LeadAssignees, useLeadAssignees } from './use-lead-assignees';
import { type InboxActs, useLeadInboxActs } from './use-lead-inbox-acts';
import { usePaginatedList } from './use-paginated-list';
import { useSession } from './use-session';

/** One page of the queue: enough to triage a morning's leads without a second read. */
const INBOX_PAGE = 20;
const INBOX_ASK = { limit: INBOX_PAGE } as const;

/** What the open picker gives: one lead, or the selection (`M02-29`). */
export type InboxPicking =
  | { readonly kind: 'lead'; readonly lead: LeadSummary }
  | { readonly kind: 'selection'; readonly count: number };

/**
 * The Lead Inbox (`SCR-M02-02`) as both screens draw it, assembled once (Law 11): the queue with
 * every act's line in place, the deck and its moves, the team's faces, the picker, the selection
 * and the bulk assign. Every act is completed by the server and shown in progress until it
 * confirms (`M02-67`).
 */
export interface LeadInboxScreen {
  /** The reader's shell offers Leads; anyone else meets not found. */
  readonly allowed: boolean;
  /** The reader may give leads (`F2.M02.assign-leads`): the faces and the picker show. */
  readonly canAssign: boolean;
  /** The reader may bin a lead (`F2.M02.lead-state-changes`). */
  readonly canJunk: boolean;
  /** The ways the teaching inbox offers: an import only to those who may import (`crm.import_leads`). */
  readonly ways: readonly LeadSource[];
  readonly readerId: string | null;
  /** The queue: loading, failed with its retry, empty — the teaching inbox — or ready. */
  readonly read: Read<InboxView<LeadSummary>>;
  /** The queue as drawn; nothing while the read is out. */
  readonly view: InboxView<LeadSummary>;
  /** The deck's lead that just left, as the card it was, flying off; null once the deck moves on. */
  readonly departed: { readonly lead: LeadSummary; readonly elapsedMs: number } | null;
  readonly team: LeadAssignees;
  readonly loadingMore: boolean;
  showMore(): void;
  /** One tap on a face: gives the lead, no confirm (`M02-28`). */
  give(leadId: string, assignee: Assignee): void;
  junk(leadId: string): void;
  retry(leadId: string): void;
  dismiss(leadId: string): void;
  /** *Next* or *Previous* lead on the deck (`↓`, `↑`). */
  step(step: 1 | -1): void;
  /** The phone's Select: the rows show their ticks instead of their acts. */
  readonly selecting: boolean;
  setSelecting(on: boolean): void;
  select(leadId: string, selected: boolean): void;
  clearSelection(): void;
  readonly picking: InboxPicking | null;
  openPicker(leadId: string): void;
  openSelectionPicker(): void;
  closePicker(): void;
  /** The picker's one tap: gives the lead or the whole selection, and the picker closes. */
  pick(userId: string): void;
  readonly bulkReport: InboxActs['bulkReport'];
  dismissBulkReport(): void;
}

const NOTHING: InboxView<LeadSummary> = inboxViewOf(
  [],
  { totalCount: 0, pastDayCount: 0, oldestAt: null },
  { settled: new Set(), acts: new Map(), held: new Map(), selected: new Set(), cursor: null },
  0,
);

export function useLeadInboxScreen(): LeadInboxScreen {
  const { user, chosenHome } = useSession();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles ?? [];
  const canAssign = can(roles, 'crm.assign_leads');
  const key = queryKeys.crm.inbox(tenantId, INBOX_ASK);
  const repositories = useRepositories();
  const list = usePaginatedList({
    queryKey: key,
    fetchPage: (page) => repositories.leads.inbox({ ...INBOX_ASK, page }),
    enabled: tenantId !== '',
  });
  /* The head's counts ride on each page; the newest page counted the queue last. */
  const head = queryClient.getQueryData<InfiniteData<LeadInbox>>(key)?.pages.at(-1);
  const team = useLeadAssignees();
  const [cursor, setCursor] = useState<InboxCursor | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [picking, setPicking] = useState<InboxPicking | null>(null);
  const shown = useRef(NOTHING);
  const acts = useLeadInboxActs(
    tenantId,
    (leadId) => shown.current.deck?.lead.id === leadId,
    (leadId) => setSelected((now) => without(now, leadId)),
  );

  const view =
    list.read.kind === 'ready'
      ? inboxViewOf(
          list.shown,
          {
            totalCount: list.totalCount,
            pastDayCount: head?.past24Hours ?? 0,
            oldestAt: head?.oldestAt ?? null,
          },
          { settled: acts.settled, acts: acts.acts, held: acts.held, selected, cursor },
          Date.now(),
        )
      : NOTHING;
  shown.current = view;
  const read: Read<InboxView<LeadSummary>> =
    list.read.kind !== 'ready'
      ? list.read
      : view.queue.length === 0
        ? { kind: 'empty' }
        : { kind: 'ready', value: view };

  /* The deck holds its lead by id; once that lead leaves, the one that rose into its place is it. */
  const deckId = view.deck?.lead.id ?? null;
  useEffect(() => {
    if (deckId === null || deckId === cursor?.leadId) return;
    setCursor({ leadId: deckId, index: view.position });
  }, [deckId, cursor?.leadId, view.position]);

  const leadOf = (leadId: string) => view.queue.find((card) => card.lead.id === leadId)?.lead;
  const assigneeOf = (userId: string) => team.people.find((person) => person.userId === userId);

  return {
    allowed: offersDoor(shellViewFor(roles, chosenHome), 'leads'),
    canAssign,
    canJunk: can(roles, 'crm.lead_state_changes'),
    ways: LEAD_SOURCES.filter((way) => way !== 'import' || can(roles, 'crm.import_leads')),
    readerId: user?.id ?? null,
    read,
    view,
    departed:
      acts.departed === null
        ? null
        : {
            lead: acts.departed,
            elapsedMs: Math.max(0, Date.now() - Date.parse(acts.departed.createdAt)),
          },
    team,
    loadingMore: list.isFetchingNextPage,
    showMore: () => {
      if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
    },
    give: (leadId, assignee) => {
      const lead = leadOf(leadId);
      if (lead !== undefined && canAssign) acts.give(lead, assignee);
    },
    junk: (leadId) => {
      const lead = leadOf(leadId);
      if (lead !== undefined) acts.junk(lead);
    },
    retry: (leadId) => {
      const lead = leadOf(leadId);
      if (lead !== undefined) acts.retry(lead);
    },
    dismiss: acts.dismiss,
    step: (by) => {
      acts.clearDeparted();
      setCursor(cursorStepped(view.queue, cursor, by));
    },
    selecting,
    setSelecting: (on) => {
      setSelecting(on);
      if (!on) setSelected(new Set());
    },
    select: (leadId, on) =>
      setSelected((now) => (on ? new Set(now).add(leadId) : without(now, leadId))),
    clearSelection: () => {
      setSelected(new Set());
      setSelecting(false);
    },
    picking,
    openPicker: (leadId) => {
      const lead = leadOf(leadId);
      const card = view.queue.find((one) => one.lead.id === leadId);
      if (lead !== undefined && !isActOut(card?.act ?? null)) setPicking({ kind: 'lead', lead });
    },
    openSelectionPicker: () => {
      if (view.selection.length > 0)
        setPicking({ kind: 'selection', count: view.selection.length });
    },
    closePicker: () => setPicking(null),
    pick: (userId) => {
      const to = assigneeOf(userId);
      if (to === undefined || picking === null) return;
      setPicking(null);
      if (picking.kind === 'lead') {
        acts.give(picking.lead, to);
        return;
      }
      const leads = view.selection.flatMap((leadId) => leadOf(leadId) ?? []);
      setSelected(new Set());
      setSelecting(false);
      acts.giveAll(leads, to);
    },
    bulkReport: acts.bulkReport,
    dismissBulkReport: acts.dismissBulkReport,
  };
}

function without(set: ReadonlySet<string>, member: string): ReadonlySet<string> {
  if (!set.has(member)) return set;
  const next = new Set(set);
  next.delete(member);
  return next;
}
