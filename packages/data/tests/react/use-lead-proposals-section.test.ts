// @vitest-environment happy-dom
import type { LeadDetail, LeadProposals } from '@heliogrid/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLeadProposalsSection } from '../../src/react/use-lead-proposals-section';
import { priya } from './lead-detail-origin';
import { LEAD, PROPOSAL } from './proposals-fixtures';
import { provided, refusal, sell } from './proposals-origin';

/**
 * The lead's Proposals section through the real client (`T-M06-001`, `T-M06-031`, `M06-58`):
 * *Create* resumes the open draft, and the withdraw sheet closes once the server took it, or
 * stays with why.
 */

const item = (over: Partial<LeadProposals['items'][number]>): LeadProposals['items'][number] => ({
  id: PROPOSAL,
  number: 'PRP-0042',
  version: 1,
  standing: 'shared',
  progress: { complete: 11, of: 11 },
  capacityKw: 3.3,
  payable: '190575.00',
  madeBy: null,
  madeAt: '2026-11-11T10:00:00.000Z',
  updatedAt: '2026-11-12T10:00:00.000Z',
  live: true,
  ...over,
});

function leadWith(items: LeadProposals['items']): LeadDetail {
  const lead = priya();
  return {
    ...lead,
    lead: { ...lead.lead, id: LEAD },
    proposals: { items, canStart: true, canWithdraw: true, sibling: null },
  } as LeadDetail;
}

function mounted(lead: LeadDetail) {
  const moves = {
    toBuilder: vi.fn(),
    toProposal: vi.fn(),
    toLead: vi.fn(),
    toSiteDetails: vi.fn(),
  };
  const view = renderHook(() => useLeadProposalsSection(LEAD, lead, moves), {
    wrapper: provided(),
  });
  return { view, moves };
}

const withdrawals = () => sell.sent.filter((write) => write.path.endsWith('/withdraw'));

describe('the lead’s Proposals section', () => {
  it('Create resumes the draft that is open instead of starting another', () => {
    const draftId = '01a30000-0000-7000-8000-00000000b009';
    const { view, moves } = mounted(
      leadWith([item({}), item({ id: draftId, number: null, version: null, standing: 'draft' })]),
    );

    act(() => view.result.current.create());

    expect(moves.toBuilder).toHaveBeenCalledWith(draftId);
    expect(view.result.current.start.open).toBe(false);
  });

  it('with no draft open, Create opens the start sheet', () => {
    const { view, moves } = mounted(leadWith([item({})]));

    act(() => view.result.current.create());

    expect(moves.toBuilder).not.toHaveBeenCalled();
    expect(view.result.current.start.open).toBe(true);
  });

  it('the withdraw sheet closes once the server took it', async () => {
    const { view } = mounted(leadWith([item({})]));

    act(() => view.result.current.withdraw.ask(PROPOSAL));
    act(() => view.result.current.withdraw.confirm());
    await waitFor(() => expect(view.result.current.withdraw.proposalId).toBeNull());

    expect(withdrawals()).toHaveLength(1);
    expect(view.result.current.withdraw.failure).toBeNull();
  });

  it('a withdraw that fails keeps the sheet open with why, and a close waits for the answer', async () => {
    sell.writes = [{ status: 500, body: refusal('INTERNAL'), afterMs: 40 }];
    const { view } = mounted(leadWith([item({})]));

    act(() => view.result.current.withdraw.ask(PROPOSAL));
    act(() => view.result.current.withdraw.confirm());
    act(() => view.result.current.withdraw.close());
    await waitFor(() => expect(view.result.current.withdraw.failure).not.toBeNull());

    expect(view.result.current.withdraw.proposalId).toBe(PROPOSAL);
    expect(view.result.current.withdraw.failure).toMatchObject({ kind: 'failed' });
  });
});
