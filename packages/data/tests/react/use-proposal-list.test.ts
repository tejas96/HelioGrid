// @vitest-environment happy-dom

import type { ProposalEntry } from '@heliogrid/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProposalList } from '../../src/react/use-proposal-list';
import { provided, sell } from './proposals-origin';

/** A row as the page draws it: a design by its kind, a proposal by where it stands. */
const shown = (row: ProposalEntry) => (row.kind === 'design' ? 'design' : row.standing);

/**
 * The Proposals page through the real client (`SCR-M06-19`, `T-M05-001b`): the chip that is on is
 * the filter the read asks with, every chip's count rides on each answer, and a chip swaps the rows
 * in place.
 */
describe('the Proposals page — one chip at a time, every chip’s count always', () => {
  it('reads every proposal and design first, with the counts and the waiting value', async () => {
    const view = renderHook(() => useProposalList(), { wrapper: provided() });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));

    const { read, head } = view.result.current;
    expect(read.kind === 'ready' && read.value.map(shown)).toEqual(['design', 'draft', 'opened']);
    expect(head).toMatchObject({
      counts: { '3d': 1, all: 3, waiting: 1, draft: 1, accepted: 0, closed: 0 },
      waitingValue: '190575.00',
      canStart: true,
      currencyCode: 'INR',
    });
    expect(sell.entryAsks.at(-1)?.get('filter')).toBe('all');
  });

  it('a chip asks with its filter, and the last rows stay until the new ones land', async () => {
    const view = renderHook(() => useProposalList(), { wrapper: provided() });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));

    act(() => view.result.current.setFilter('draft'));
    expect(view.result.current.filter).toBe('draft');
    // The swap is in place: the rows read before are still drawn, and the counts still stand.
    expect(view.result.current.read.kind).toBe('ready');
    expect(view.result.current.refreshing).toBe(true);
    expect(view.result.current.head?.counts.all).toBe(3);

    await waitFor(() => expect(view.result.current.refreshing).toBe(false));
    const { read } = view.result.current;
    expect(read.kind === 'ready' && read.value.map(shown)).toEqual(['draft']);
    expect(view.result.current.totalCount).toBe(1);
    expect(sell.entryAsks.at(-1)?.get('filter')).toBe('draft');
  });

  it('the 3D chip asks for the designs alone', async () => {
    const view = renderHook(() => useProposalList(), { wrapper: provided() });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));

    act(() => view.result.current.setFilter('3d'));
    await waitFor(() => expect(view.result.current.refreshing).toBe(false));

    const { read } = view.result.current;
    expect(read.kind === 'ready' && read.value.map(shown)).toEqual(['design']);
    expect(sell.entryAsks.at(-1)?.get('filter')).toBe('3d');
  });

  it('a pull reads the rows again; a return to fresh rows asks nothing', async () => {
    const view = renderHook(() => useProposalList(), { wrapper: provided() });
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    const asked = sell.entryAsks.length;

    act(() => view.result.current.refreshIfStale());
    expect(sell.entryAsks.length).toBe(asked);

    act(() => view.result.current.refresh());
    await waitFor(() => expect(sell.entryAsks.length).toBe(asked + 1));
    await waitFor(() => expect(view.result.current.pulled).toBe(false));
  });
});
