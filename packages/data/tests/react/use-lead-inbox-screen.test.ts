// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  AMIT,
  ANJALI_DEACTIVATED,
  cardOf,
  holdWrites,
  mountedInbox,
  NEHA,
  OWNER_ROLE,
  origin,
  PRIYA,
  queueOf,
  RAJESH,
  READ_RETRIES_MS,
  SALES_EXECUTIVE,
  SALES_MANAGER,
  UNNAMED,
} from './lead-inbox-origin';
import { refusal } from './origin-wire';

/**
 * The Lead Inbox's acts, end to end through the real client (`M02-24`, `M02-28`, `M02-29`,
 * `M02-67`): each act shows in its lead's card while the server has it and never as done; a
 * confirmed lead leaves and the next rises; one that comes back undone stays, naming why.
 */
describe('the inbox queue', () => {
  it('lists the leads newest first, the newest on the deck, with the head counted', async () => {
    const view = await mountedInbox();
    const { view: inbox } = view.result.current;
    expect(queueOf(view)).toEqual([PRIYA.id, UNNAMED.id, AMIT.id]);
    expect(inbox.deck?.lead.id).toBe(PRIYA.id);
    expect([inbox.waiting, inbox.pastDay]).toEqual([3, 1]);
  });

  it('an empty queue is the teaching inbox', async () => {
    expect((await mountedInbox([])).result.current.read.kind).toBe('empty');
  });

  it.each([
    { role: OWNER_ROLE, ways: ['quick_add', 'import', 'referral'] },
    { role: SALES_MANAGER, ways: ['quick_add', 'import', 'referral'] },
    { role: SALES_EXECUTIVE, ways: ['quick_add', 'referral'] },
  ] as const)(
    'the teaching inbox offers an import only to someone who may import leads ($role)',
    async ({ role, ways }) => {
      origin.roles = [role];
      expect((await mountedInbox([])).result.current.ways).toEqual(ways);
    },
  );

  it(
    'a failed read says so and offers its retry',
    async () => {
      origin.failInbox = true;
      const failed = await mountedInbox();
      expect(failed.result.current.read.kind).toBe('failed');
    },
    READ_RETRIES_MS + 5_000,
  );

  it('the faces are exactly the people the server lists — a deactivated member is never offered (`M02-28`)', async () => {
    const view = await mountedInbox();
    await waitFor(() => expect(view.result.current.team.read.kind).toBe('ready'));
    const offered = view.result.current.team.people.map((person) => person.userId);
    expect(offered).toEqual([RAJESH.userId, NEHA.userId]);
    expect(offered).not.toContain(ANJALI_DEACTIVATED);
  });
});

describe('assign from a face — pending, then done (M02-67)', () => {
  it('shows "Assigning to" in the card until the server confirms, then the lead leaves and the next rises', async () => {
    const view = await mountedInbox();
    const release = holdWrites();
    act(() => view.result.current.give(PRIYA.id, RAJESH));
    await waitFor(() => expect(origin.writes).toHaveLength(1));
    expect(cardOf(view, PRIYA.id).act).toEqual({
      act: 'assign',
      assignee: RAJESH,
      returned: null,
    });
    expect(view.result.current.view.deck?.lead.id).toBe(PRIYA.id);
    expect(origin.writes[0]?.body).toEqual({ assigneeId: RAJESH.userId, expectedOwnerId: null });

    act(() => view.result.current.give(PRIYA.id, NEHA));
    act(() => view.result.current.junk(UNNAMED.id));
    await waitFor(() => expect(origin.writes).toHaveLength(2));
    expect(origin.writes.map((write) => write.path)).toEqual([
      `/leads/${PRIYA.id}/assign`,
      `/leads/${UNNAMED.id}/junk`,
    ]);

    release();
    await waitFor(() => expect(queueOf(view)).toEqual([AMIT.id]));
    expect(view.result.current.view.deck?.lead.id).toBe(AMIT.id);
    expect(view.result.current.departed?.lead.id).toBe(PRIYA.id);
  });
});

describe('assign — pending, then returned naming the reason (M02-67)', () => {
  it('a lost race returns the lead naming who has it, and it stays until its line is cleared', async () => {
    const view = await mountedInbox();
    origin.assigns = [
      {
        status: 409,
        body: {
          error: {
            code: 'LEAD_ALREADY_ASSIGNED',
            message: 'taken',
            requestId: 'test',
            facts: { owner: { userId: NEHA.userId, name: NEHA.name } },
          },
        },
      },
    ];
    origin.queue = origin.queue.filter((one) => one.id !== PRIYA.id);
    act(() => view.result.current.give(PRIYA.id, RAJESH));
    await waitFor(() =>
      expect(cardOf(view, PRIYA.id).act?.returned).toEqual({ kind: 'taken', owner: NEHA.name }),
    );
    await waitFor(() => expect(view.result.current.view.waiting).toBe(2));
    expect(queueOf(view)).toContain(PRIYA.id);

    act(() => view.result.current.dismiss(PRIYA.id));
    expect(queueOf(view)).toEqual([UNNAMED.id, AMIT.id]);
  });

  it.each([
    [
      'the person can no longer hold a lead',
      { status: 422, body: refusal('ASSIGNEE_UNAVAILABLE') },
      { kind: 'assignee_unavailable' },
    ],
    [
      'the lead is no longer one to give',
      { status: 404, body: refusal('NOT_FOUND') },
      { kind: 'unavailable' },
    ],
    [
      'no answer came: unconfirmed, not failed',
      'drop' as const,
      { kind: 'unanswered', failure: 'no_connection' },
    ],
  ])('%s', async (_, answer, why) => {
    const view = await mountedInbox();
    origin.assigns = [answer];
    act(() => view.result.current.give(PRIYA.id, RAJESH));
    await waitFor(() => expect(cardOf(view, PRIYA.id).act?.returned).toEqual(why));
    expect(view.result.current.view.deck?.lead.id).toBe(PRIYA.id);
  });

  it('Try again sends the same assign once more and lands it', async () => {
    const view = await mountedInbox();
    origin.assigns = ['drop'];
    act(() => view.result.current.give(PRIYA.id, RAJESH));
    await waitFor(() => expect(cardOf(view, PRIYA.id).act?.returned?.kind).toBe('unanswered'));
    act(() => view.result.current.retry(PRIYA.id));
    await waitFor(() => expect(queueOf(view)).not.toContain(PRIYA.id));
    expect(origin.writes.map((write) => write.body)).toEqual([
      { assigneeId: RAJESH.userId, expectedOwnerId: null },
      { assigneeId: RAJESH.userId, expectedOwnerId: null },
    ]);
  });
});

describe('junk — one tap, server-completed', () => {
  it('bins the lead once the server confirms; a refusal names the reason', async () => {
    const view = await mountedInbox();
    act(() => view.result.current.junk(UNNAMED.id));
    await waitFor(() => expect(queueOf(view)).toEqual([PRIYA.id, AMIT.id]));

    origin.junks = [{ status: 500, body: refusal('INTERNAL') }];
    act(() => view.result.current.junk(AMIT.id));
    await waitFor(() =>
      expect(cardOf(view, AMIT.id).act?.returned).toEqual({ kind: 'refused', code: 'INTERNAL' }),
    );
  });
});

describe('a confirmed act says so, and junk can be undone', () => {
  it('a binned lead is named with Undo, which reopens it back into the queue', async () => {
    const view = await mountedInbox();
    act(() => view.result.current.junk(UNNAMED.id));
    await waitFor(() =>
      expect(view.result.current.note).toEqual({ kind: 'junked', lead: UNNAMED }),
    );

    act(() => view.result.current.undoJunk());
    await waitFor(() =>
      expect(view.result.current.note).toEqual({ kind: 'restored', lead: UNNAMED }),
    );
    expect(origin.writes.at(-1)?.path).toBe(`/leads/${UNNAMED.id}/reopen`);
    await waitFor(() => expect(queueOf(view)).toEqual([PRIYA.id, UNNAMED.id, AMIT.id]));
  });

  it('an undo the server refuses says so, and the lead stays binned', async () => {
    const view = await mountedInbox();
    act(() => view.result.current.junk(AMIT.id));
    await waitFor(() => expect(view.result.current.note?.kind).toBe('junked'));
    origin.reopens = [{ status: 500, body: refusal('INTERNAL') }];
    act(() => view.result.current.undoJunk());
    await waitFor(() =>
      expect(view.result.current.note).toEqual({ kind: 'undo-failed', lead: AMIT }),
    );
    expect(queueOf(view)).toEqual([PRIYA.id, UNNAMED.id]);
  });

  it('a single assign names who has it now; the note clears on dismiss', async () => {
    const view = await mountedInbox();
    act(() => view.result.current.give(PRIYA.id, RAJESH));
    await waitFor(() =>
      expect(view.result.current.note).toEqual({ kind: 'given', lead: PRIYA, name: RAJESH.name }),
    );
    act(() => view.result.current.dismissNote());
    expect(view.result.current.note).toBeNull();
  });
});
