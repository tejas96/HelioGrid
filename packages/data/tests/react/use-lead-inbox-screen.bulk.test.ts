// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  AMIT,
  cardOf,
  holdWrites,
  mountedInbox,
  NEHA,
  origin,
  PRIYA,
  queueOf,
  RAJESH,
  UNNAMED,
} from './lead-inbox-origin';
import { refusal } from './origin-wire';

/**
 * The Lead Inbox's acts, end to end through the real client (`M02-24`, `M02-28`, `M02-29`,
 * `M02-67`): each act shows in its lead's card while the server has it and never as done; a
 * confirmed lead leaves and the next rises; one that comes back undone stays, naming why.
 */
describe('bulk assign — one target for a selection (M02-29)', () => {
  it('assigns each selected lead, shows each pending, and reports each result', async () => {
    const view = await mountedInbox();
    await waitFor(() => expect(view.result.current.team.read.kind).toBe('ready'));
    act(() => {
      view.result.current.select(UNNAMED.id, true);
      view.result.current.select(AMIT.id, true);
    });
    act(() => view.result.current.openSelectionPicker());
    expect(view.result.current.picking).toEqual({ kind: 'selection', count: 2 });

    const release = holdWrites();
    origin.bulks = [
      {
        status: 200,
        body: {
          results: [
            { leadId: UNNAMED.id, outcome: 'assigned' },
            { leadId: AMIT.id, outcome: 'unavailable' },
          ],
        },
      },
    ];
    act(() => view.result.current.pick(NEHA.userId));
    await waitFor(() => expect(origin.writes).toHaveLength(1));
    expect(view.result.current.picking).toBeNull();
    expect(cardOf(view, UNNAMED.id).act?.returned).toBeNull();
    expect(cardOf(view, AMIT.id).act?.returned).toBeNull();
    expect(origin.writes[0]?.body).toEqual({
      leadIds: [UNNAMED.id, AMIT.id],
      assigneeId: NEHA.userId,
    });

    origin.queue = origin.queue.filter((one) => one.id !== UNNAMED.id);
    release();
    await waitFor(() =>
      expect(view.result.current.bulkReport).toEqual({ given: 1, refused: 1, name: NEHA.name }),
    );
    expect(queueOf(view)).toEqual([PRIYA.id, AMIT.id]);
    expect(cardOf(view, AMIT.id).act?.returned).toEqual({ kind: 'unavailable' });
    expect(view.result.current.view.selection).toEqual([]);
  });
});

describe('bulk assign — each lead answers for itself (M02-29, M02-67)', () => {
  it('a mixed answer: the given lead leaves, one someone else holds stays naming them, one gone stays naming that', async () => {
    const view = await mountedInbox();
    await waitFor(() => expect(view.result.current.team.read.kind).toBe('ready'));
    act(() => {
      for (const lead of [PRIYA, UNNAMED, AMIT]) view.result.current.select(lead.id, true);
    });
    act(() => view.result.current.openSelectionPicker());
    origin.bulks = [
      {
        status: 200,
        body: {
          results: [
            { leadId: PRIYA.id, outcome: 'assigned' },
            {
              leadId: UNNAMED.id,
              outcome: 'already_assigned',
              owner: { userId: RAJESH.userId, name: RAJESH.name },
            },
            { leadId: AMIT.id, outcome: 'unavailable' },
          ],
        },
      },
    ];
    origin.queue = origin.queue.filter((one) => one.id === AMIT.id);
    act(() => view.result.current.pick(NEHA.userId));

    await waitFor(() =>
      expect(view.result.current.bulkReport).toEqual({ given: 1, refused: 2, name: NEHA.name }),
    );
    expect(queueOf(view)).toEqual([UNNAMED.id, AMIT.id]);
    expect(cardOf(view, UNNAMED.id).act?.returned).toEqual({ kind: 'taken', owner: RAJESH.name });
    expect(cardOf(view, AMIT.id).act?.returned).toEqual({ kind: 'unavailable' });
  });

  it('a send the server refused whole returns each lead with the one reason', async () => {
    const view = await mountedInbox();
    await waitFor(() => expect(view.result.current.team.read.kind).toBe('ready'));
    act(() => {
      view.result.current.select(UNNAMED.id, true);
      view.result.current.select(AMIT.id, true);
    });
    act(() => view.result.current.openSelectionPicker());
    origin.bulks = [{ status: 422, body: refusal('ASSIGNEE_UNAVAILABLE') }];
    act(() => view.result.current.pick(NEHA.userId));

    await waitFor(() =>
      expect(cardOf(view, AMIT.id).act?.returned).toEqual({ kind: 'assignee_unavailable' }),
    );
    expect(cardOf(view, UNNAMED.id).act?.returned).toEqual({ kind: 'assignee_unavailable' });
    expect(queueOf(view)).toEqual([PRIYA.id, UNNAMED.id, AMIT.id]);
  });
});
