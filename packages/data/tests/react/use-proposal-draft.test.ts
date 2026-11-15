// @vitest-environment happy-dom
import { onlineManager } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useProposalCache } from '../../src/react/proposal-cache';
import type { DraftChange } from '../../src/react/proposal-draft-queue';
import { useProposalDraft } from '../../src/react/use-proposal-draft';
import { useProposalEnergy } from '../../src/react/use-proposal-energy';
import { PROPOSAL, proposalDetail } from './proposals-fixtures';
import { provided, refusal, refusalWith, sell } from './proposals-origin';

/**
 * The draft's saves through the real client (`M06-25`, `T-M06-023`): each field commits on the
 * revision the last answer gave, in the order it was left; a commit that does not land keeps what
 * was typed and says so; nothing is overwritten and nothing is queued offline.
 */

const price = (priceInclusive: string): DraftChange => ({
  fields: (stored) => ({ system: { ...stored.system, priceInclusive } }),
});
const address = (siteAddress: string): DraftChange => ({ deal: { siteAddress } });

const bodies = () => sell.sent.map((write) => write.body as Record<string, unknown>);

async function mounted() {
  const view = renderHook(
    () => ({ draft: useProposalDraft(PROPOSAL), energy: useProposalEnergy(PROPOSAL) }),
    { wrapper: provided() },
  );
  await waitFor(() => expect(view.result.current.draft.read.kind).toBe('ready'));
  return view;
}

afterEach(() => onlineManager.setOnline(true));

describe('the draft’s saves — in order, on the last answer’s revision', () => {
  it('a field left after another goes after it, on the revision the first answered', async () => {
    sell.writes = [{ status: 200, afterMs: 40 }];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    act(() => view.result.current.draft.commit('address', address('14 Baner Road')));
    expect(view.result.current.draft.stateOf('price')).toEqual({ kind: 'saving' });
    expect(view.result.current.draft.stateOf('address')).toEqual({ kind: 'saving' });
    await waitFor(() => expect(view.result.current.draft.saving).toBe(false));

    expect(bodies().map((body) => body.revision)).toEqual([0, 1]);
    expect(bodies()[1]).toMatchObject({ deal: { siteAddress: '14 Baner Road' } });
    expect(view.result.current.draft.lastSaved).toBe('address');
    expect(view.result.current.draft.stateOf('address')).toEqual({ kind: 'saved' });
    const { read } = view.result.current.draft;
    expect(read.kind === 'ready' && read.value.document.money?.payable.amount).toBe('200000.00');
    expect(read.kind === 'ready' && read.value.revision).toBe(2);
  });

  it('a value typed again while its field waits replaces the waiting one', async () => {
    sell.writes = [{ status: 200, afterMs: 40 }];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    act(() => view.result.current.draft.commit('address', address('first')));
    act(() => view.result.current.draft.commit('address', address('second')));
    await waitFor(() => expect(view.result.current.draft.saving).toBe(false));

    expect(bodies()).toHaveLength(2);
    expect(bodies()[1]).toMatchObject({ deal: { siteAddress: 'second' } });
  });

  it('a value typed while its own send is out goes after it and is the one that stands', async () => {
    sell.writes = [{ status: 200, afterMs: 40 }];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    act(() => view.result.current.draft.commit('price', price('210000.00')));
    await waitFor(() => expect(view.result.current.draft.saving).toBe(false));

    expect(bodies().map((body) => body.revision)).toEqual([0, 1]);
    expect(view.result.current.draft.fields?.system.priceInclusive).toBe('210000.00');
  });

  it('the generation fill goes through the same queue, after the field before it', async () => {
    sell.writes = [{ status: 200, afterMs: 40 }];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    act(() => view.result.current.energy.fill());
    await waitFor(() => expect(view.result.current.energy.state).toEqual({ kind: 'saved' }));

    expect(sell.sent.map((write) => write.path)).toEqual([
      `/proposals/${PROPOSAL}`,
      `/proposals/${PROPOSAL}/energy`,
    ]);
    expect(bodies()[1]).toMatchObject({ revision: 1, mode: 'fill' });
  });
});

describe('a detail read out across a commit never puts an older revision back', () => {
  it('a slow read started before a commit answers after it: the newer revision stays', async () => {
    const view = renderHook(
      () => ({ draft: useProposalDraft(PROPOSAL), cache: useProposalCache() }),
      { wrapper: provided() },
    );
    await waitFor(() => expect(view.result.current.draft.read.kind).toBe('ready'));
    sell.detailAfterMs = 80;

    act(() => void view.result.current.cache.reread(PROPOSAL));
    await waitFor(() => expect(sell.detailReads).toBe(2));
    act(() => view.result.current.draft.commit('price', price('200000.00')));
    await waitFor(() => expect(view.result.current.draft.lastSaved).toBe('price'));
    await new Promise((resolve) => setTimeout(resolve, 120));

    const { read } = view.result.current.draft;
    expect(read.kind === 'ready' && read.value.revision).toBe(1);
    act(() => view.result.current.draft.commit('address', address('14 Baner Road')));
    await waitFor(() => expect(view.result.current.draft.lastSaved).toBe('address'));
    expect(view.result.current.draft.conflict).toBeNull();
  });
});

describe('a commit that does not land — the typed value is kept, and nothing claims it saved', () => {
  it('a failed commit keeps what was typed, says not saved, and saves on retry', async () => {
    sell.writes = [{ status: 500, body: refusal('INTERNAL') }];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    await waitFor(() =>
      expect(view.result.current.draft.stateOf('price')).toEqual({
        kind: 'unsaved',
        reason: 'failed',
      }),
    );

    expect(view.result.current.draft.fields?.system.priceInclusive).toBe('200000.00');
    expect(view.result.current.draft.unsaved).toBe(1);
    expect(view.result.current.draft.lastSaved).toBeNull();
    const stored = view.result.current.draft.read;
    expect(stored.kind === 'ready' && stored.value.document.fields.system.priceInclusive).toBe(
      '190575.00',
    );

    act(() => view.result.current.draft.retry('price'));
    await waitFor(() =>
      expect(view.result.current.draft.stateOf('price')).toEqual({ kind: 'saved' }),
    );
    expect(view.result.current.draft.unsaved).toBe(0);
  });

  it('a value the server refuses stays typed with its line, and is not sent again', async () => {
    sell.writes = [{ status: 422, body: refusal('DOMAIN_RULE_VIOLATION') }];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    await waitFor(() =>
      expect(view.result.current.draft.stateOf('price')).toMatchObject({
        kind: 'refused',
        failure: { kind: 'failed', code: 'DOMAIN_RULE_VIOLATION' },
      }),
    );

    expect(view.result.current.draft.fields?.system.priceInclusive).toBe('200000.00');
    expect(view.result.current.draft.saving).toBe(false);
    act(() => view.result.current.draft.retry());
    act(() => view.result.current.draft.commit('address', address('14 Baner Road')));
    await waitFor(() =>
      expect(view.result.current.draft.stateOf('address')).toEqual({ kind: 'saved' }),
    );
    expect(sell.sent).toHaveLength(2);
    expect(view.result.current.draft.stateOf('price')).toMatchObject({ kind: 'refused' });
  });

  it('a refused value holds Generate back without hanging it, until it is let go', async () => {
    sell.writes = [{ status: 422, body: refusal('DOMAIN_RULE_VIOLATION') }];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    await waitFor(() =>
      expect(view.result.current.draft.stateOf('price')).toMatchObject({ kind: 'refused' }),
    );
    await expect(view.result.current.draft.settled()).resolves.toBe(false);

    act(() => view.result.current.draft.drop('price'));
    expect(view.result.current.draft.fields?.system.priceInclusive).toBe('190575.00');
    expect(view.result.current.draft.stateOf('price')).toBeNull();
    await expect(view.result.current.draft.settled()).resolves.toBe(true);
  });

  it('typing the refused field again lets the refused value go and sends the new one', async () => {
    sell.writes = [{ status: 422, body: refusal('DOMAIN_RULE_VIOLATION') }];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    await waitFor(() =>
      expect(view.result.current.draft.stateOf('price')).toMatchObject({ kind: 'refused' }),
    );
    act(() => view.result.current.draft.commit('price', price('195000.00')));
    await waitFor(() =>
      expect(view.result.current.draft.stateOf('price')).toEqual({ kind: 'saved' }),
    );
    expect(view.result.current.draft.fields?.system.priceInclusive).toBe('195000.00');
  });

  it('changed on another device: refused, kept, nothing more sent until the reload', async () => {
    const view = await mounted();
    sell.proposal = proposalDetail({ revision: 5, priceInclusive: '150000.00' });

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    await waitFor(() =>
      expect(view.result.current.draft.conflict).toEqual({ kind: 'changed_elsewhere' }),
    );

    expect(view.result.current.draft.stateOf('price')).toEqual({
      kind: 'unsaved',
      reason: 'conflict',
    });
    expect(view.result.current.draft.fields?.system.priceInclusive).toBe('200000.00');
    act(() => view.result.current.draft.commit('address', address('14 Baner Road')));
    act(() => view.result.current.draft.retry());
    expect(sell.sent).toHaveLength(1);

    await expect(view.result.current.draft.settled()).resolves.toBe(false);

    act(() => view.result.current.draft.reload());
    await waitFor(() =>
      expect(view.result.current.draft.fields?.system.priceInclusive).toBe('150000.00'),
    );
    expect(view.result.current.draft.conflict).toBeNull();
    expect(view.result.current.draft.unsaved).toBe(0);
  });

  it('the lead moved to someone else: the commit names who', async () => {
    const movedTo = { userId: '01a30000-0000-7000-8000-00000000d001', name: 'Priya Kulkarni' };
    sell.writes = [
      { status: 409, body: refusalWith('PROPOSAL_LEAD_MOVED', { revision: 0, movedTo }) },
    ];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    await waitFor(() =>
      expect(view.result.current.draft.conflict).toEqual({ kind: 'lead_moved', to: movedTo }),
    );
    expect(view.result.current.draft.fields?.system.priceInclusive).toBe('200000.00');
  });

  it('offline: the value is kept and nothing is queued; a retry sends it once back', async () => {
    const view = await mounted();
    act(() => onlineManager.setOnline(false));

    act(() => view.result.current.draft.commit('price', price('200000.00')));

    expect(view.result.current.draft.offline).toBe(true);
    expect(view.result.current.draft.stateOf('price')).toEqual({
      kind: 'unsaved',
      reason: 'offline',
    });
    expect(view.result.current.draft.fields?.system.priceInclusive).toBe('200000.00');
    expect(sell.sent).toHaveLength(0);

    act(() => onlineManager.setOnline(true));
    // Coming back online sends nothing by itself.
    expect(sell.sent).toHaveLength(0);
    act(() => view.result.current.draft.retry());
    await waitFor(() =>
      expect(view.result.current.draft.stateOf('price')).toEqual({ kind: 'saved' }),
    );
    expect(view.result.current.draft.offline).toBe(false);
  });

  it('a commit that meets no connection keeps every value waiting behind it too', async () => {
    sell.writes = ['drop'];
    const view = await mounted();

    act(() => view.result.current.draft.commit('price', price('200000.00')));
    act(() => view.result.current.draft.commit('address', address('14 Baner Road')));
    await waitFor(() => expect(view.result.current.draft.unsaved).toBe(2));

    expect(view.result.current.draft.offline).toBe(true);
    expect(sell.sent).toHaveLength(1);
  });
});
