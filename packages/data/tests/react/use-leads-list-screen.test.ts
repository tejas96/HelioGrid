// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  aRow,
  holdReads,
  lastAsk,
  mountedList,
  origin,
  RAJESH,
  READ_RETRIES_MS,
  READER,
  shownIds,
} from './leads-list-origin';

/**
 * The Leads list's reads, end to end through the real client (`SCR-M02-03`, `M02-40`, `M02-52`):
 * whose leads, each filter as the read asks it, the pipeline holding its shape while a filter
 * narrows the rows, the first run, no match, a failure and *Show more*.
 */
const MINE = aRow(1, { stage: 'qualified', source: 'referral' });
const THEIRS = aRow(2, { owner: { userId: RAJESH, name: 'Rajesh Jadhav' } });
const QUIET = aRow(3, { state: 'dormant' });
const SNOOZED = aRow(4, { state: 'snoozed', wakeOn: '2026-11-14' });

describe('the leads list', () => {
  it('an owner opens on every lead, newest first, with the pipeline and the inbox beside it', async () => {
    const view = await mountedList([MINE, THEIRS, QUIET, SNOOZED], 6);
    const screen = view.result.current;
    expect(screen.whoseChoices).toEqual(['mine', 'all']);
    expect(screen.filters.whose).toBe('all');
    expect(lastAsk()).not.toHaveProperty('ownerId');
    expect(shownIds(view)).toEqual([MINE.id, THEIRS.id, SNOOZED.id]);
    await waitFor(() => expect(view.result.current.inboxWaiting).toBe(6));
    const { read } = view.result.current;
    if (read.kind !== 'ready') throw new Error(read.kind);
    expect(read.value.pipeline).toMatchObject({ open: 3, dormant: 1 });
    expect(read.value.rows[2]?.next).toEqual({ kind: 'snoozed', wakeOn: '2026-11-14' });
  });

  it.each([
    ['Mine names the reader as owner', 'setWhose', 'mine', { ownerId: READER }],
    ['a stage of the meter filters to it', 'pickStage', 'qualified', { stage: 'qualified' }],
    ['Dormant asks for the quiet leads', 'toggleDormant', undefined, { state: 'dormant' }],
    ['a source narrows to it', 'setSource', 'referral', { source: 'referral' }],
    ['the Bill chip orders largest first', 'stepBillSort', undefined, { sort: 'monthly_bill' }],
  ] as const)('%s', async (_, act_, value, asked) => {
    const view = await mountedList([MINE, THEIRS, QUIET]);
    const counted = origin.asks.length;
    act(() => (view.result.current[act_] as (input?: string) => void)(value));
    await waitFor(() => expect(origin.asks.length).toBeGreaterThan(counted));
    expect(lastAsk()).toMatchObject(asked);
  });

  it('a filter that matches nothing keeps the pipeline and Clear filters brings every lead back', async () => {
    const view = await mountedList([MINE, THEIRS]);
    act(() => view.result.current.pickStage('survey'));
    await waitFor(() => {
      const { read } = view.result.current;
      expect(read.kind === 'ready' && read.value.noMatch).toBe(true);
    });
    const { read } = view.result.current;
    if (read.kind !== 'ready') throw new Error(read.kind);
    expect(read.value).toMatchObject({ filtersOn: 1, clearable: true, pipeline: { open: 2 } });
    act(() => view.result.current.clearFilters());
    await waitFor(() => expect(shownIds(view)).toEqual([MINE.id, THEIRS.id]));
    expect(view.result.current.filters.stage).toBeNull();
  });

  it('typing asks once the typing rests, never per key', async () => {
    const view = await mountedList([MINE, THEIRS]);
    const counted = origin.asks.length;
    act(() => view.result.current.setQuery('L'));
    act(() => view.result.current.setQuery('Le'));
    act(() => view.result.current.setQuery('Lead 2'));
    await waitFor(() => expect(shownIds(view)).toEqual([THEIRS.id]));
    expect(origin.asks.length).toBe(counted + 1);
    expect(lastAsk()).toMatchObject({ q: 'Lead 2' });
  });

  it('a company with no lead is the first run', async () => {
    expect((await mountedList([])).result.current.read.kind).toBe('empty');
  });

  it(
    'a failed read says so and offers its retry',
    async () => {
      origin.failList = true;
      const view = await mountedList([MINE], 0);
      expect(view.result.current.read.kind).toBe('failed');
    },
    READ_RETRIES_MS + 5_000,
  );

  it('Show more brings the next page with its own wait', async () => {
    const many = Array.from({ length: 25 }, (_, n) => aRow(n + 1));
    const view = await mountedList(many);
    expect(shownIds(view)).toHaveLength(20);
    const { read } = view.result.current;
    expect(read.kind === 'ready' && read.value.unread).toBe(5);
    const release = holdReads();
    act(() => view.result.current.showMore());
    await waitFor(() => expect(view.result.current.loadingMore).toBe(true));
    expect(shownIds(view)).toHaveLength(20);
    release();
    await waitFor(() => expect(shownIds(view)).toHaveLength(25));
    expect(view.result.current.loadingMore).toBe(false);
  });
});
