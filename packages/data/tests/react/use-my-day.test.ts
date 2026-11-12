// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MY_DAY_SHOWN, useMyDay } from '../../src/react/use-my-day';
import { useTenantId } from '../../src/react/use-tenant-id';
import {
  aDay,
  answerNext,
  mountedOver,
  NEITHER,
  origin,
  readsOf,
  settle,
  writesTo,
} from './home-origin';

/**
 * My Day (`SCR-M07-01`) through the real client: read only on a home that holds it; the next one
 * up in the hero and out of its band; each band its first few until *Show more*; a tick, a move
 * and an answered call land as writes the contract accepts, each with *Undo* where it has one.
 */

describe('My Day — who reads it', () => {
  it('a home without My Day reads nothing', async () => {
    origin.roles = [NEITHER];
    const view = mountedOver(() => ({ day: useMyDay(), tenant: useTenantId() }));
    await waitFor(() => expect(view.result.current.tenant).not.toBe(''));
    await settle();
    expect(view.result.current.day.shown).toBe(false);
    expect(readsOf('/my-day')).toEqual([]);
  });
});

describe('My Day — the hero and the bands', () => {
  it('the next one up is the hero and is left out of its band', async () => {
    origin.day = aDay(2, 1, 1);
    const view = mountedOver(() => useMyDay());
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    const { next, bands } = view.result.current;
    expect(next?.task.id).toBe(origin.day.nextTaskId);
    expect(bands.map((band) => [band.band, band.count])).toEqual([
      ['overdue', 1],
      ['today', 1],
      ['week', 1],
    ]);
    expect(bands.flatMap((band) => band.rows).some((row) => row.task.id === next?.task.id)).toBe(
      false,
    );
  });

  it.each([
    ['as many as a band shows: all, nothing hidden', MY_DAY_SHOWN + 1, MY_DAY_SHOWN, 0],
    ['two more: the first few, the rest behind Show more', MY_DAY_SHOWN + 3, MY_DAY_SHOWN, 2],
  ])('%s', async (_, overdue, shown, hidden) => {
    origin.day = aDay(overdue, 0, 0);
    const view = mountedOver(() => useMyDay());
    await waitFor(() => expect(view.result.current.bands).toHaveLength(1));
    expect(view.result.current.bands[0]?.rows).toHaveLength(shown);
    expect(view.result.current.bands[0]?.hidden).toBe(hidden);
  });

  it('Show more opens that band alone', async () => {
    origin.day = aDay(MY_DAY_SHOWN + 3, 0, MY_DAY_SHOWN + 1);
    const view = mountedOver(() => useMyDay());
    await waitFor(() => expect(view.result.current.bands).toHaveLength(2));
    act(() => view.result.current.expand('overdue'));
    const [overdue, week] = view.result.current.bands;
    expect(overdue?.hidden).toBe(0);
    expect(week?.hidden).toBe(1);
  });

  it('an empty day is ready with no hero and no band', async () => {
    origin.day = aDay(0, 0, 0);
    const view = mountedOver(() => useMyDay());
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    expect(view.result.current.next).toBeNull();
    expect(view.result.current.bands).toEqual([]);
  });
});

describe('My Day — acts', () => {
  it('a tick is done at once and Undo reopens it', async () => {
    const view = mountedOver(() => useMyDay());
    await waitFor(() => expect(view.result.current.next).not.toBeNull());
    const item = view.result.current.next;
    if (item === null) throw new Error('no next');
    act(() => view.result.current.done(item));
    await waitFor(() => expect(view.result.current.lastAct?.kind).toBe('done'));
    expect(writesTo(`/tasks/${item.task.id}/done`)).toHaveLength(1);
    act(() => view.result.current.undo());
    await waitFor(() => expect(view.result.current.lastAct).toBeNull());
    expect(writesTo(`/tasks/${item.task.id}/reopen`)).toHaveLength(1);
  });

  it('Move to tomorrow sends the same clock time on the next company day', async () => {
    const view = mountedOver(() => useMyDay());
    await waitFor(() => expect(view.result.current.next).not.toBeNull());
    const item = view.result.current.next;
    if (item === null) throw new Error('no next');
    act(() => view.result.current.moveToTomorrow(item));
    await waitFor(() => expect(view.result.current.lastAct?.kind).toBe('moved'));
    const [moved] = origin.writes.filter((write) => write.method === 'PATCH');
    if (moved === undefined) throw new Error('no move was sent');
    const due = (moved.body as { dueAt: string }).dueAt;
    expect(due.slice(11)).toBe(item.task.dueAt.slice(11));
    expect(Date.parse(due)).toBeGreaterThan(Date.now());
    act(() => view.result.current.undo());
    await waitFor(() => expect(origin.writes.filter((w) => w.method === 'PATCH')).toHaveLength(2));
    const back = origin.writes.filter((w) => w.method === 'PATCH')[1]?.body as { dueAt: string };
    expect(back.dueAt).toBe(item.task.dueAt);
  });

  it('an answered call is logged on the lead and closes the task', async () => {
    const view = mountedOver(() => useMyDay());
    await waitFor(() => expect(view.result.current.next).not.toBeNull());
    const item = view.result.current.next;
    if (item === null) throw new Error('no next');
    act(() => view.result.current.called(item));
    expect(view.result.current.asking?.task.id).toBe(item.task.id);
    act(() => view.result.current.answer('no_answer'));
    await waitFor(() => expect(view.result.current.asking).toBeNull());
    expect(
      writesTo(`/leads/${item.lead.id}/calls`).map((w) => (w.body as { outcome: string }).outcome),
    ).toEqual(['no_answer']);
    expect(writesTo(`/tasks/${item.task.id}/done`)).toHaveLength(1);
  });

  it('a tick that fails says so and leaves no Undo', async () => {
    const view = mountedOver(() => useMyDay());
    await waitFor(() => expect(view.result.current.next).not.toBeNull());
    const item = view.result.current.next;
    if (item === null) throw new Error('no next');
    answerNext('done', {
      status: 409,
      body: { error: { code: 'CONFLICT', message: 'cancelled' } },
    });
    act(() => view.result.current.done(item));
    await waitFor(() => expect(view.result.current.failed).toBe(true));
    expect(view.result.current.lastAct).toBeNull();
  });

  it('Not now closes the ask and logs nothing', async () => {
    const view = mountedOver(() => useMyDay());
    await waitFor(() => expect(view.result.current.next).not.toBeNull());
    const item = view.result.current.next;
    if (item === null) throw new Error('no next');
    act(() => view.result.current.called(item));
    act(() => view.result.current.skipAnswer());
    expect(view.result.current.asking).toBeNull();
    await settle();
    expect(writesTo('/calls')).toEqual([]);
  });
});
