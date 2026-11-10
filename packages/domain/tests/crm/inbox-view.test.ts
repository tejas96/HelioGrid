import { describe, expect, it } from 'vitest';
import {
  bulkAssignReportOf,
  cursorStepped,
  type InboxActState,
  type InboxCounts,
  type InboxCursor,
  type InboxLead,
  type InboxTriage,
  inboxViewOf,
} from '../../src/crm/inbox-view';

const NOW = Date.parse('2026-11-09T03:00:00Z');
const HOUR = 3_600_000;

function lead(id: string, hoursAgo: number): InboxLead {
  return {
    id,
    name: null,
    city: null,
    source: 'quick_add',
    createdAt: new Date(NOW - hoursAgo * HOUR).toISOString(),
    monthlyBill: null,
  };
}

/** Newest first, as the server lists the queue: a 1 h, b 5 h, c 30 h, d 50 h. */
const LISTED = [lead('a', 1), lead('b', 5), lead('c', 30), lead('d', 50)];
const COUNTS: InboxCounts = {
  totalCount: 6,
  pastDayCount: 4,
  oldestAt: LISTED[3]?.createdAt ?? null,
};

const RAJESH = { userId: 'rajesh', name: 'Rajesh Jadhav' };
const OUT: InboxActState = { act: 'assign', assignee: RAJESH, returned: null };
const TAKEN: InboxActState = {
  act: 'assign',
  assignee: RAJESH,
  returned: { kind: 'taken', owner: 'Neha Kulkarni' },
};

function triage(overrides: Partial<InboxTriage<InboxLead>> = {}): InboxTriage<InboxLead> {
  return {
    settled: new Set(),
    acts: new Map(),
    held: new Map(),
    selected: new Set(),
    cursor: null,
    ...overrides,
  };
}

const ids = (cards: readonly { lead: InboxLead }[]) => cards.map((card) => card.lead.id);

describe('inboxViewOf — the queue while acts are out (M02-23, M02-67)', () => {
  it('shows the newest lead on the deck and the rest under it, counted from the server', () => {
    const view = inboxViewOf(LISTED, COUNTS, triage(), NOW);
    expect(view.deck?.lead.id).toBe('a');
    expect(ids(view.upNext)).toEqual(['b', 'c', 'd']);
    expect([view.waiting, view.pastDay, view.unread]).toEqual([6, 4, 2]);
    expect(view.oldestElapsedMs).toBe(50 * HOUR);
  });

  it.each<[string, Partial<InboxTriage<InboxLead>>, string[], number]>([
    [
      'an act out keeps the lead in place',
      { acts: new Map([['b', OUT]]) },
      ['a', 'b', 'c', 'd'],
      6,
    ],
    ['a confirmed act takes the lead out', { settled: new Set(['b']) }, ['a', 'c', 'd'], 5],
    [
      'a returned lead the read no longer lists stays in its place',
      { acts: new Map([['x', TAKEN]]), held: new Map([['x', lead('x', 3)]]) },
      ['a', 'x', 'b', 'c', 'd'],
      6,
    ],
  ])('%s', (_, change, queue, waiting) => {
    const view = inboxViewOf(LISTED, COUNTS, triage(change), NOW);
    expect(ids(view.queue)).toEqual(queue);
    expect(view.waiting).toBe(waiting);
  });

  it('a lead past 24 hours that settles leaves the past-24-hours count', () => {
    const view = inboxViewOf(LISTED, COUNTS, triage({ settled: new Set(['c']) }), NOW);
    expect([view.waiting, view.pastDay]).toEqual([5, 3]);
  });

  it.each<[string, InboxCursor | null, string | null]>([
    ['no cursor: the newest', null, 'a'],
    ['its own lead while it waits', { leadId: 'c', index: 2 }, 'c'],
    ['its lead gone: the one that rose into its place', { leadId: 'gone', index: 1 }, 'b'],
    ['its lead gone from the end: the last', { leadId: 'gone', index: 9 }, 'd'],
  ])('the deck — %s', (_, cursor, deck) => {
    expect(inboxViewOf(LISTED, COUNTS, triage({ cursor }), NOW).deck?.lead.id ?? null).toBe(deck);
  });

  it('an empty queue has no deck', () => {
    const view = inboxViewOf([], { totalCount: 0, pastDayCount: 0, oldestAt: null }, triage(), NOW);
    expect([view.deck, view.position, view.waiting, view.oldestElapsedMs]).toEqual([
      null,
      0,
      0,
      null,
    ]);
  });

  it('a selection sends only the leads with no act out (M02-29)', () => {
    const view = inboxViewOf(
      LISTED,
      COUNTS,
      triage({
        selected: new Set(['a', 'b', 'c', 'gone']),
        acts: new Map([
          ['b', OUT],
          ['c', TAKEN],
        ]),
      }),
      NOW,
    );
    expect(view.selection).toEqual(['a', 'c']);
  });
});

describe('cursorStepped — next and previous, held at the ends', () => {
  const queue = LISTED.map((one) => ({ lead: one }));
  it.each<[InboxCursor | null, 1 | -1, InboxCursor | null]>([
    [null, 1, { leadId: 'b', index: 1 }],
    [null, -1, { leadId: 'a', index: 0 }],
    [{ leadId: 'd', index: 3 }, 1, { leadId: 'd', index: 3 }],
    [{ leadId: 'c', index: 2 }, -1, { leadId: 'b', index: 1 }],
  ])('from %j by %i', (cursor, step, next) => {
    expect(cursorStepped(queue, cursor, step)).toEqual(next);
  });

  it('nothing waits: no cursor', () => {
    expect(cursorStepped([], null, 1)).toBeNull();
  });
});

describe('bulkAssignReportOf — each lead of a bulk assign (M02-29, M02-67)', () => {
  it.each([
    ['given', { leadId: 'a', outcome: 'assigned' }, null],
    ['theirs already, so it left all the same', { leadId: 'a', outcome: 'unchanged' }, null],
    [
      'someone else holds it',
      { leadId: 'a', outcome: 'already_assigned', owner: { name: 'Rajesh Jadhav' } },
      { kind: 'taken', owner: 'Rajesh Jadhav' },
    ],
    ['no longer one to give', { leadId: 'a', outcome: 'unavailable' }, { kind: 'unavailable' }],
    ['not answered for: unconfirmed', null, { kind: 'unanswered', failure: 'unreadable_answer' }],
  ] as const)('a lead %s', (_, result, returned) => {
    const report = bulkAssignReportOf(['a'], result === null ? [] : [result]);
    expect(report).toEqual({
      given: returned === null ? 1 : 0,
      returned: returned === null ? new Map() : new Map([['a', returned]]),
    });
  });

  it('counts the leads given across a mixed answer and names why each other one stayed', () => {
    const report = bulkAssignReportOf(
      ['a', 'b', 'c'],
      [
        { leadId: 'a', outcome: 'assigned' },
        { leadId: 'b', outcome: 'already_assigned', owner: { name: 'Neha Kulkarni' } },
        { leadId: 'c', outcome: 'unavailable' },
      ],
    );
    expect(report.given).toBe(1);
    expect([...report.returned]).toEqual([
      ['b', { kind: 'taken', owner: 'Neha Kulkarni' }],
      ['c', { kind: 'unavailable' }],
    ]);
  });
});
