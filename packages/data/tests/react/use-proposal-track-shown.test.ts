// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  type ProposalTrackMoves,
  useProposalTrackScreen,
} from '../../src/react/use-proposal-track-screen';
import { PROPOSAL, proposalDetail } from './proposals-fixtures';
import { provided, sell } from './proposals-origin';

/**
 * Track shows what the customer's link serves — the latest SHARED version — until the newer one is
 * shared (`M06-45`, `T-M06-018`): its cover, its summary and its Generated time; the newer version
 * waits with its own act.
 */

const ignored = () => undefined;
const moves: ProposalTrackMoves = {
  toBuilder: ignored,
  toDocument: ignored,
  toVersions: ignored,
  toLinks: ignored,
  toLead: ignored,
  toProject: ignored,
  callLead: ignored,
  dial: ignored,
  openChat: ignored,
  copy: ignored,
  openFile: ignored,
  toTaxNumber: ignored,
};

const V1_AT = '2026-11-14T05:50:00.000Z';
const V2_AT = '2026-11-14T06:04:00.000Z';
const summaryOf = (
  version: number,
  payable: string,
  generatedAt: string,
  sharedAt: string | null,
) => ({
  version,
  generatedAt,
  generatedBy: null,
  trigger: version === 1 ? 'first_generate' : 'change',
  changeNote: null,
  payable,
  sharedAt,
  answer: null,
  answeredAt: null,
  onLink: sharedAt !== null,
  inForce: false,
});

function served(v2SharedAt: string | null) {
  const v1 = summaryOf(1, '190575.00', V1_AT, '2026-11-14T05:52:00.000Z');
  const v2 = { ...summaryOf(2, '175000.00', V2_AT, v2SharedAt), onLink: v2SharedAt !== null };
  const first = { ...v1, onLink: v2SharedAt === null };
  const documentAt = (price: string) =>
    proposalDetail({ priceInclusive: price, status: 'shared' }).document;
  sell.versions = [
    { ...first, proposalId: PROPOSAL, document: documentAt('190575.00'), diff: null },
    { ...v2, proposalId: PROPOSAL, document: documentAt('175000.00'), diff: null },
  ];
  const detail = proposalDetail({
    priceInclusive: '175000.00',
    status: 'shared',
    standing: 'opened',
  });
  sell.proposal = {
    ...detail,
    versions: [v2, first],
    tracking: { ...detail.tracking, generatedAt: V2_AT },
  };
}

describe('Track while a newer version waits to be shared (M06-45)', () => {
  it.each([
    ['v2 generated, not shared: v1 shows, v2 waits', null, '190575.00', V1_AT, 2],
    ['v2 shared: v2 shows, nothing waits', '2026-11-14T06:10:00.000Z', '175000.00', V2_AT, null],
  ] as const)('%s', async (_, v2Shared, payable, generatedAt, awaiting) => {
    served(v2Shared);
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, moves), { wrapper: provided() });

    await waitFor(() => expect(view.result.current.shown.kind).toBe('ready'));
    const { shown, read } = view.result.current;
    expect(shown.kind === 'ready' ? shown.value.money?.payable.amount : null).toBe(payable);
    expect(read.kind === 'ready' ? read.value.tracking.generatedAt : null).toBe(generatedAt);
    expect(view.result.current.awaitingShare).toBe(awaiting);
  });

  it('the waiting version’s act opens the share sheet', async () => {
    served(null);
    const view = renderHook(() => useProposalTrackScreen(PROPOSAL, moves), { wrapper: provided() });
    await waitFor(() => expect(view.result.current.shown.kind).toBe('ready'));

    act(() => view.result.current.acts.share_ready());

    expect(view.result.current.sheet).toBe('share');
  });
});
