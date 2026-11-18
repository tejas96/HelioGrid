// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNewProposalFlow } from '../../src/react/use-new-proposal-flow';
import { recorded } from './proposal-page-moves';
import { LEAD } from './proposals-fixtures';
import { provided, refusalWith, sell } from './proposals-origin';

/**
 * The start sheet's *With 3D design* through the real client (`T-M05-001b`): a design the lead
 * refuses says why on the sheet, and that word leaves once the person picks another way — it never
 * stands over a later start's own answer.
 */
describe('With 3D design — its failure shows where it was pressed, and only there', () => {
  it('a closed lead refuses the design; picking Quick takes the refusal off the sheet', async () => {
    const opened: string[] = [];
    const view = renderHook(() => useNewProposalFlow(recorded(opened)), { wrapper: provided() });
    act(() => view.result.current.openNew());
    act(() => view.result.current.startOn(LEAD, 'residential'));
    await waitFor(() => expect(view.result.current.start.canDesign).toBe(true));
    sell.writes = [
      { status: 422, body: refusalWith('DESIGN_ACT_REFUSED', { refusal: 'host_closed' }) },
    ];

    act(() => view.result.current.start.setMode('design'));
    act(() => view.result.current.start.go());
    await waitFor(() => expect(view.result.current.start.designFailure).toBe('host_closed'));
    expect(view.result.current.start.open).toBe(true);
    expect(opened).toEqual([]);

    act(() => view.result.current.start.setMode('quick'));
    expect(view.result.current.start.designFailure).toBeNull();
  });
});
