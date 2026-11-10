import type { ProvenanceTier } from '../format/qualified';
import type { TransportFailure } from '../format/transport-failure';
import { isUnassignedOverdue } from './crm-clock';

/*
 * The Lead Inbox (`SCR-M02-02`) decided once for both apps: the one queue as the person sees it
 * while their acts are out (`M02-23`, `M02-67`), the lead the deck shows, and the head's counts.
 * Nothing here is optimistic — a lead leaves only once the server confirmed its act (`F8-36`).
 */

/** What the inbox reads of a waiting lead; the wire's `LeadSummary` satisfies it. */
export interface InboxLead {
  readonly id: string;
  readonly name: string | null;
  readonly city: string | null;
  /** A source a newer server learned is shown as sent (`extensibleEnum`). */
  readonly source: string;
  readonly createdAt: string;
  readonly monthlyBill: { readonly amount: string; readonly tier: ProvenanceTier } | null;
}

/** The two triage decisions (`M02-24`). */
export type InboxAct = 'assign' | 'junk';

/**
 * Why an act came back undone, for the line that names it (`M02-67`): someone assigned it first;
 * it is no longer one this person may act on (gone, out of reach, binned or closed); the person
 * it went to can no longer hold a lead; no readable answer came, so it is unconfirmed, not failed;
 * or the server refused it for another reason, kept as its code alone — the screen words it from
 * the catalog in the reader's language, never in the server's English.
 */
export type InboxActReturn =
  | { readonly kind: 'taken'; readonly owner: string | null }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'assignee_unavailable' }
  | { readonly kind: 'unanswered'; readonly failure: TransportFailure }
  | { readonly kind: 'refused'; readonly code: string };

/** One lead's act: out while `returned` is null, else back undone and why. */
export interface InboxActState {
  readonly act: InboxAct;
  /** Who the lead is being given to, by id and name; null for junk. */
  readonly assignee: { readonly userId: string; readonly name: string } | null;
  readonly returned: InboxActReturn | null;
}

/** The deck's place: the lead it shows, and where it stood — the next rises there when it leaves. */
export interface InboxCursor {
  readonly leadId: string;
  readonly index: number;
}

/** What the person did that the last read does not hold yet. */
export interface InboxTriage<L extends InboxLead> {
  /** Leads whose act the server confirmed: they leave the queue before the next read lands. */
  readonly settled: ReadonlySet<string>;
  readonly acts: ReadonlyMap<string, InboxActState>;
  /** A returned lead as it was shown: it stays in the queue, naming why, until its line is cleared. */
  readonly held: ReadonlyMap<string, L>;
  readonly selected: ReadonlySet<string>;
  readonly cursor: InboxCursor | null;
}

/** The head's facts as the server counted them over the whole queue. */
export interface InboxCounts {
  readonly totalCount: number;
  /** Waiting MORE than 24 hours, the escalation's rule (`isUnassignedOverdue`, `M02-50`). */
  readonly pastDayCount: number;
  readonly oldestAt: string | null;
}

export interface InboxCard<L extends InboxLead> {
  readonly lead: L;
  /** Wall-clock milliseconds since capture (`M02-24`'s age). */
  readonly elapsedMs: number;
  readonly act: InboxActState | null;
  /** Its act is out: its own acts wait, every other lead's stay live (`M02-67`). */
  readonly waiting: boolean;
  readonly selected: boolean;
}

export interface InboxView<L extends InboxLead> {
  /** The lead the deck shows; null when nothing waits. */
  readonly deck: InboxCard<L> | null;
  /** The deck's place in the queue, from 0. */
  readonly position: number;
  /** Every lead the person can act on, newest first, the deck's among them. */
  readonly queue: readonly InboxCard<L>[];
  /** The queue without the deck's lead: what waits under it. */
  readonly upNext: readonly InboxCard<L>[];
  readonly waiting: number;
  /** Waiting past the 24-hour escalation (`M02-50`). */
  readonly pastDay: number;
  readonly oldestElapsedMs: number | null;
  /** Waiting beyond the pages read — what *Show more* brings. */
  readonly unread: number;
  /** The selected leads a bulk assign may send (`M02-29`): none with its act out. */
  readonly selection: readonly string[];
}

/** An act is out on this lead: its acts wait for the answer. */
export function isActOut(act: InboxActState | null): boolean {
  return act !== null && act.returned === null;
}

/** Newest first, as the server orders the queue: capture time, then id. */
function newestFirst(a: InboxLead, b: InboxLead): number {
  const byTime = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (byTime !== 0) return byTime;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/**
 * The deck's place: its own lead while it waits; once that lead is gone, the lead that rose into
 * its place — the last one when it stood at the end.
 */
export function deckIndexOf(
  queue: readonly { readonly lead: InboxLead }[],
  cursor: InboxCursor | null,
): number {
  if (queue.length === 0) return -1;
  if (cursor === null) return 0;
  const own = queue.findIndex((card) => card.lead.id === cursor.leadId);
  return own === -1 ? Math.min(cursor.index, queue.length - 1) : own;
}

/** The queue as the person sees it: the read less what settled, with each held lead kept in its place. */
function queueOf<L extends InboxLead>(listed: readonly L[], triage: InboxTriage<L>): L[] {
  const listedIds = new Set(listed.map((lead) => lead.id));
  const kept = [...triage.held.values()].filter((lead) => !listedIds.has(lead.id));
  return [...listed, ...kept].filter((lead) => !triage.settled.has(lead.id)).sort(newestFirst);
}

/** The inbox for one read and what the person did since (`M02-23`, `M02-67`). */
export function inboxViewOf<L extends InboxLead>(
  listed: readonly L[],
  counts: InboxCounts,
  triage: InboxTriage<L>,
  now: number,
): InboxView<L> {
  const queue = queueOf(listed, triage).map(
    (lead): InboxCard<L> => ({
      lead,
      elapsedMs: Math.max(0, now - Date.parse(lead.createdAt)),
      act: triage.acts.get(lead.id) ?? null,
      waiting: isActOut(triage.acts.get(lead.id) ?? null),
      selected: triage.selected.has(lead.id),
    }),
  );
  const position = deckIndexOf(queue, triage.cursor);
  const settledListed = listed.filter((lead) => triage.settled.has(lead.id));
  const settledPastDay = settledListed.filter((lead) =>
    isUnassignedOverdue(Date.parse(lead.createdAt), now),
  ).length;
  const waiting = Math.max(0, counts.totalCount - settledListed.length);
  return {
    deck: queue[position] ?? null,
    position: Math.max(0, position),
    queue,
    upNext: queue.filter((_, index) => index !== position),
    waiting,
    pastDay: Math.max(0, counts.pastDayCount - settledPastDay),
    oldestElapsedMs:
      counts.oldestAt === null ? null : Math.max(0, now - Date.parse(counts.oldestAt)),
    unread: Math.max(0, waiting - (listed.length - settledListed.length)),
    selection: queue.filter((card) => card.selected && !card.waiting).map((card) => card.lead.id),
  };
}

/**
 * Where the deck goes on *Next* or *Previous* (`↓`, `↑`): one place along the queue, held at its
 * ends; null when nothing waits.
 */
export function cursorStepped(
  queue: readonly { readonly lead: InboxLead }[],
  cursor: InboxCursor | null,
  step: 1 | -1,
): InboxCursor | null {
  const at = deckIndexOf(queue, cursor);
  if (at === -1) return null;
  const index = Math.min(queue.length - 1, Math.max(0, at + step));
  const lead = queue[index]?.lead;
  return lead === undefined ? null : { leadId: lead.id, index };
}

/** One lead's answer to a bulk assign, as the server reports each; the wire's result satisfies it. */
export interface BulkAssignResultFacts {
  readonly leadId: string;
  readonly outcome: string;
  /** Who holds the lead, when someone else's stayed with them (`already_assigned`). */
  readonly owner?: { readonly name: string };
}

/** What a bulk assign came to (`M02-29`): how many left the inbox, and each that stayed and why. */
export interface BulkAssignReport {
  /** Given to the person — or theirs already, so it left the inbox all the same. */
  readonly given: number;
  /** Each lead that stayed, by id, with the reason its card names (`M02-67`). */
  readonly returned: ReadonlyMap<string, InboxActReturn>;
}

/**
 * Why one lead of a bulk assign stayed, or `null` when it left: someone else holds it; it is no
 * longer one to give; or the answer named it not at all, so what became of it is unconfirmed.
 */
function bulkReturnOf(result: BulkAssignResultFacts | undefined): InboxActReturn | null {
  if (result === undefined) return { kind: 'unanswered', failure: 'unreadable_answer' };
  switch (result.outcome) {
    case 'assigned':
    case 'unchanged':
      return null;
    case 'already_assigned':
      return { kind: 'taken', owner: result.owner?.name ?? null };
    default:
      return { kind: 'unavailable' };
  }
}

/** Each lead `sent` read against the server's answer for it. */
export function bulkAssignReportOf(
  sent: readonly string[],
  results: readonly BulkAssignResultFacts[],
): BulkAssignReport {
  const answered = new Map(results.map((result) => [result.leadId, result]));
  const returned = new Map<string, InboxActReturn>();
  for (const leadId of sent) {
    const why = bulkReturnOf(answered.get(leadId));
    if (why !== null) returned.set(leadId, why);
  }
  return { given: sent.length - returned.size, returned };
}
