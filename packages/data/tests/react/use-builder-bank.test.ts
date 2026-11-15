// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBuilderBank } from '../../src/react/use-builder-bank';
import { useProposal } from '../../src/react/use-proposal';
import { PROPOSAL } from './proposals-fixtures';
import { provided, sell } from './proposals-origin';

/**
 * Step 11's bank account for a holder of the settings right (`M06-17`), through the real client: it
 * is written to the business profile — the one write-point — with the rest of the profile as stored,
 * part-typed facts kept as typed, and the proposal read again so its own page shows the account.
 */

const proposalReads = () => sell.detailReads;

const profileWrites = () =>
  sell.sent.filter((write) => write.path === '/settings/business-profile');

async function mountedBank(enabled = true) {
  const view = renderHook(() => useBuilderBank(PROPOSAL, enabled), { wrapper: provided() });
  if (enabled) await waitFor(() => expect(view.result.current).not.toBeNull());
  return view;
}

describe('useBuilderBank — the company’s account, written where every proposal reads it', () => {
  it('a holder with no account on file reads four empty facts', async () => {
    const view = await mountedBank();
    expect(view.result.current?.details).toEqual({
      bankName: '',
      accountName: '',
      accountNumber: '',
      bankRoutingIdentifier: '',
    });
  });

  it('one fact typed is kept as typed — the account is not whole yet — with the profile unchanged', async () => {
    const view = await mountedBank();

    act(() => view.result.current?.onDetail('bankName', 'HDFC Bank'));
    await waitFor(() => expect(profileWrites()).toHaveLength(1));

    expect(profileWrites()[0]?.body).toMatchObject({
      companyName: 'Suryodaya Solar Pvt Ltd',
      bankDetails: null,
      bankDetailsTyped: {
        bankName: 'HDFC Bank',
        accountName: null,
        accountNumber: null,
        bankRoutingIdentifier: null,
      },
    });
    expect(view.result.current?.details.bankName).toBe('HDFC Bank');
  });

  it('the fourth fact makes the account whole: it is stored as the account, and nothing is left typed', async () => {
    const view = await mountedBank();
    const facts = [
      ['bankName', 'HDFC Bank'],
      ['accountName', 'Suryodaya Solar Pvt Ltd'],
      ['accountNumber', '50100234567812'],
      ['bankRoutingIdentifier', 'HDFC0001234'],
    ] as const;
    for (const [field, value] of facts) {
      act(() => view.result.current?.onDetail(field, value));
      await waitFor(() => expect(view.result.current?.saving).toBe(false));
    }

    expect(profileWrites().at(-1)?.body).toMatchObject({
      bankDetails: {
        bankName: 'HDFC Bank',
        accountName: 'Suryodaya Solar Pvt Ltd',
        accountNumber: '50100234567812',
        bankRoutingIdentifier: 'HDFC0001234',
      },
      bankDetailsTyped: null,
    });
  });

  it('a fact left while the last one’s write is out is written after it, with both kept', async () => {
    sell.writes = [{ status: 200, afterMs: 60 }];
    const view = await mountedBank();

    act(() => view.result.current?.onDetail('bankName', 'HDFC Bank'));
    act(() => view.result.current?.onDetail('accountName', 'Suryodaya Solar Pvt Ltd'));
    await waitFor(() => expect(profileWrites()).toHaveLength(2));
    await waitFor(() => expect(view.result.current?.saving).toBe(false));

    expect(profileWrites()[1]?.body).toMatchObject({
      bankDetailsTyped: { bankName: 'HDFC Bank', accountName: 'Suryodaya Solar Pvt Ltd' },
    });
  });

  it('after the write the proposal on screen is read again, so its page shows the account', async () => {
    const view = renderHook(
      () => ({ bank: useBuilderBank(PROPOSAL, true), proposal: useProposal(PROPOSAL) }),
      { wrapper: provided() },
    );
    await waitFor(() => expect(view.result.current.bank).not.toBeNull());
    await waitFor(() => expect(proposalReads()).toBe(1));

    act(() => view.result.current.bank?.onDetail('bankName', 'HDFC Bank'));
    await waitFor(() => expect(view.result.current.bank?.saving).toBe(false));

    await waitFor(() => expect(proposalReads()).toBe(2));
  });

  it('a write the server does not take says so, and keeps what was typed', async () => {
    sell.writes = [
      { status: 500, body: { error: { code: 'INTERNAL', message: 'x', requestId: 'test' } } },
    ];
    const view = await mountedBank();

    act(() => view.result.current?.onDetail('bankName', 'HDFC Bank'));
    await waitFor(() => expect(view.result.current?.failed).toBe(true));

    expect(view.result.current?.details.bankName).toBe('HDFC Bank');
  });

  it('anyone without the right reads nothing and is offered no fields', async () => {
    const view = await mountedBank(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(view.result.current).toBeNull();
    expect(profileWrites()).toHaveLength(0);
  });
});
