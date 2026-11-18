// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProposalListScreen } from '../../src/react/use-proposal-list-screen';
import { nowhere, recorded } from './proposal-page-moves';
import { DESIGN, designEntry, PROPOSAL, proposalRow } from './proposals-fixtures';
import { provided } from './proposals-origin';

/**
 * The Proposals page's view model through the real client (`SCR-M06-19`, `T-M05-001b`): where each
 * row opens, and the rows and their chips arriving as one list.
 */
describe('the page — a draft opens in the builder, any other proposal on its own page, a design on its own', () => {
  it.each([
    [
      'a draft never generated',
      { kind: 'proposal', ...proposalRow(PROPOSAL, 'draft') },
      `builder:${PROPOSAL}`,
    ],
    [
      'a shared proposal',
      { kind: 'proposal', ...proposalRow(PROPOSAL, 'shared') },
      `proposal:${PROPOSAL}`,
    ],
    [
      'an accepted proposal',
      { kind: 'proposal', ...proposalRow(PROPOSAL, 'accepted') },
      `proposal:${PROPOSAL}`,
    ],
    ['a design with no proposal yet', designEntry(), `design:${DESIGN}`],
  ] as const)('%s', (_, row, expected) => {
    const opened: string[] = [];
    const view = renderHook(() => useProposalListScreen(recorded(opened)), {
      wrapper: provided(),
    });

    act(() => view.result.current.open(row));

    expect(opened).toEqual([expected]);
  });

  it('the rows and the chips arrive as one list, and New proposal is offered only with the head', async () => {
    const view = renderHook(() => useProposalListScreen(nowhere()), { wrapper: provided() });
    expect(view.result.current.read.kind).toBe('loading');
    expect(view.result.current.canStart).toBe(false);

    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));

    const { read } = view.result.current;
    if (read.kind !== 'ready') throw new Error('the list is not in');
    expect(read.value.rows.items.length).toBe(read.value.rows.totalCount);
    expect(read.value.counts.all).toBeGreaterThan(0);
  });
});
