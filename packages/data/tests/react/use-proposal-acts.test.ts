// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProposal } from '../../src/react/use-proposal';
import { useProposalShare } from '../../src/react/use-proposal-share';
import { useProposalStart } from '../../src/react/use-proposal-start';
import { useProposalVersions } from '../../src/react/use-proposal-versions';
import { LEAD, PROPOSAL } from './proposals-fixtures';
import { provided, refusalWith, sell } from './proposals-origin';

/**
 * A proposal's start, its share and a version's PDF through the real client (`M06-05`, `M06-48`,
 * `M06-53`, `M06-51`): one draft per ask however often it is pressed, a share that answers its
 * words with the link in them, and a PDF nobody reads until it is asked for.
 */

const START = { leadId: LEAD, quickMode: true, copyOf: null };

describe('starting a proposal — one draft per ask', () => {
  it('a new draft is made, and a lead that holds one resumes it', async () => {
    const view = renderHook(() => useProposalStart(false), { wrapper: provided() });

    act(() => view.result.current.start(START));
    await waitFor(() => expect(view.result.current.started?.resumed).toBe(false));

    sell.hasDraft = true;
    act(() => view.result.current.clear());
    act(() => view.result.current.start(START));
    await waitFor(() => expect(view.result.current.started?.resumed).toBe(true));
    expect(view.result.current.started?.proposal.id).toBe(PROPOSAL);
  });

  it('a retry after a dropped answer carries the same key and the same body', async () => {
    sell.writes = ['drop'];
    const view = renderHook(() => useProposalStart(false), { wrapper: provided() });

    act(() => view.result.current.start(START));
    await waitFor(() => expect(view.result.current.failure).toMatchObject({ kind: 'failed' }));
    act(() => view.result.current.start(START));
    await waitFor(() => expect(view.result.current.started).not.toBeNull());

    const [first, second] = sell.sent;
    expect(first?.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(second?.key).toBe(first?.key);
    expect(second?.body).toEqual(first?.body);
  });

  it('a closed lead answers domain’s reason, to offer Reopen', async () => {
    sell.writes = [
      { status: 422, body: refusalWith('PROPOSAL_ACT_REFUSED', { refusal: 'lead_closed' }) },
    ];
    const view = renderHook(() => useProposalStart(false), { wrapper: provided() });

    act(() => view.result.current.start(START));
    await waitFor(() =>
      expect(view.result.current.failure).toEqual({ kind: 'refused', refusal: 'lead_closed' }),
    );
    expect(view.result.current.started).toBeNull();
  });

  it('the reader’s recent proposals are read only while the sheet is open', async () => {
    const view = renderHook(({ open }: { open: boolean }) => useProposalStart(open), {
      wrapper: provided(),
      initialProps: { open: false },
    });
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(sell.listAsks).toHaveLength(0);

    view.rerender({ open: true });
    await waitFor(() => expect(view.result.current.recent.kind).toBe('ready'));
    expect(sell.listAsks.at(-1)?.get('mine')).toBe('true');
  });
});

describe('sharing — a tap, answered with the words and the follow-up', () => {
  it('reads the words while the sheet is open, and a share answers the link and the day', async () => {
    const view = renderHook(
      () => ({
        proposal: useProposal(PROPOSAL),
        share: useProposalShare(PROPOSAL, { share: true, acceptance: false }),
      }),
      { wrapper: provided() },
    );
    await waitFor(() => expect(view.result.current.share.message?.kind).toBe('ready'));
    const words = view.result.current.share.message;
    expect(words?.kind === 'ready' && words.value.link).toBeNull();

    act(() => view.result.current.share.share('whatsapp'));
    await waitFor(() => expect(view.result.current.share.shared).not.toBeNull());

    expect(view.result.current.share.shared).toMatchObject({
      message: { link: 'https://app.heliogrid.in/p/abc' },
      followUpOn: '2026-11-15',
    });
    expect(sell.sent.at(-1)?.body).toMatchObject({ channel: 'whatsapp' });
    const { proposal } = view.result.current;
    expect(proposal.kind === 'ready' && proposal.value.standing).toBe('shared');
    expect(view.result.current.share.acceptance).toBeNull();
  });
});

describe('a version’s PDF — made on first ask', () => {
  it('nothing is read until it is asked for; then it is being made, then there', async () => {
    const view = renderHook(() => useProposalVersions(PROPOSAL, 1), { wrapper: provided() });
    expect(view.result.current.pdf.file).toEqual({ kind: 'idle' });

    act(() => view.result.current.pdf.ask());
    await waitFor(() => expect(view.result.current.pdf.file).toEqual({ kind: 'making' }));

    sell.pdf = {
      url: 'https://files.heliogrid.in/prp-0042.pdf',
      expiresAt: '2099-01-01T00:00:00.000Z',
    };
    act(() => view.result.current.pdf.lookAgain());
    await waitFor(() =>
      expect(view.result.current.pdf.file).toEqual({ kind: 'made', download: sell.pdf }),
    );
  });
});
