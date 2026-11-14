// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { describe, expect, it } from 'vitest';
import { useDataLayer } from '../../src/react/context';
import { useProposalDraft } from '../../src/react/use-proposal-draft';
import { useProposalGenerate } from '../../src/react/use-proposal-generate';
import { PROPOSAL } from './proposals-fixtures';
import { provided, refusal, refusalWith, sell } from './proposals-origin';

/**
 * Generate through the real client (`M06-23`, `M06-44`, `T-M06-022`): it waits for every field
 * still saving, one submission keeps its retry key, and each way it can be stopped is its own state.
 */

const ASK = { changeNote: null, belowCostConfirmed: false };

async function mounted() {
  const view = renderHook(
    () => ({
      draft: useProposalDraft(PROPOSAL),
      gate: useProposalGenerate(PROPOSAL),
      denial: useSyncExternalStore(
        useDataLayer().blocked.subscribe,
        useDataLayer().blocked.getSnapshot,
      ),
    }),
    { wrapper: provided() },
  );
  await waitFor(() => expect(view.result.current.gate.verdict).not.toBeNull());
  return view;
}

const generates = () => sell.sent.filter((write) => write.path.endsWith('/generate'));

describe('Generate — one version, however many times it is pressed', () => {
  it('makes the version and its number, and the proposal reads as generated', async () => {
    const view = await mounted();

    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() =>
      expect(view.result.current.gate.generated).toEqual({ number: 'PRP-0042', version: 1 }),
    );

    expect(view.result.current.gate.failure).toBeNull();
    const { read } = view.result.current.draft;
    expect(read.kind === 'ready' && read.value.standing).toBe('ready');
  });

  it('a retry after a dropped answer carries the same key and the same body', async () => {
    sell.writes = ['drop'];
    const view = await mounted();

    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() => expect(view.result.current.gate.failure).toMatchObject({ kind: 'failed' }));
    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() => expect(view.result.current.gate.generated).not.toBeNull());

    const [first, second] = generates();
    expect(first?.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(second?.key).toBe(first?.key);
    expect(second?.body).toEqual(first?.body);
  });

  it('a second press while the first is out sends nothing', async () => {
    sell.writes = [{ status: 200, afterMs: 40 }];
    const view = await mounted();

    act(() => view.result.current.gate.generate(ASK));
    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() => expect(view.result.current.gate.generated).not.toBeNull());

    expect(generates()).toHaveLength(1);
  });

  it('waits for a field still saving, and runs on the revision that field answered', async () => {
    sell.writes = [{ status: 200, afterMs: 40 }];
    const view = await mounted();

    act(() =>
      view.result.current.draft.commit('price', {
        fields: (stored) => ({ system: { ...stored.system, priceInclusive: '200000.00' } }),
      }),
    );
    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() => expect(view.result.current.gate.generated).not.toBeNull());

    expect(generates()[0]?.body).toMatchObject({ revision: 1 });
  });

  it('a value still not saved stops it before anything is sent', async () => {
    sell.writes = [{ status: 500, body: refusal('INTERNAL') }];
    const view = await mounted();

    act(() =>
      view.result.current.draft.commit('price', {
        fields: (stored) => ({ system: { ...stored.system, priceInclusive: '200000.00' } }),
      }),
    );
    await waitFor(() => expect(view.result.current.draft.unsaved).toBe(1));
    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() => expect(view.result.current.gate.failure).toEqual({ kind: 'unsaved' }));

    expect(generates()).toHaveLength(0);
  });

  it.each([
    ['system.price', 'system'],
    ['price', null],
  ] as const)(
    'a refused value on screen stops it too, named with its step and the server’s reason (%s → %s)',
    async (key, step) => {
      sell.writes = [{ status: 422, body: refusal('DOMAIN_RULE_VIOLATION') }];
      const view = await mounted();

      act(() =>
        view.result.current.draft.commit(key, {
          fields: (stored) => ({ system: { ...stored.system, priceInclusive: '200000.00' } }),
        }),
      );
      await waitFor(() =>
        expect(view.result.current.draft.stateOf(key)).toMatchObject({ kind: 'refused' }),
      );
      const field = view.result.current.draft.stateOf(key);
      act(() => view.result.current.gate.generate(ASK));
      await waitFor(() =>
        expect(view.result.current.gate.failure).toEqual({
          kind: 'refused_field',
          step,
          failure: field?.kind === 'refused' ? field.failure : null,
        }),
      );

      expect(generates()).toHaveLength(0);
      expect(view.result.current.gate.generating).toBe(false);
    },
  );

  it('a field left after a conflict does not hang it: it answers at once, nothing sent', async () => {
    const view = await mounted();

    sell.proposal = { ...sell.proposal, revision: 7 };
    act(() =>
      view.result.current.draft.commit('price', {
        fields: (stored) => ({ system: { ...stored.system, priceInclusive: '200000.00' } }),
      }),
    );
    await waitFor(() => expect(view.result.current.draft.conflict).not.toBeNull());
    act(() => view.result.current.draft.commit('address', { deal: { siteAddress: 'Baner' } }));
    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() => expect(view.result.current.gate.failure).toEqual({ kind: 'unsaved' }));

    expect(generates()).toHaveLength(0);
  });
});

describe('Generate — each way it is stopped is its own state', () => {
  it('the server’s checklist stops it with every block', async () => {
    const verdict = {
      blocks: [{ step: 'components', fields: [], check: 'component_missing', category: 'panel' }],
      warnings: [],
      skipped: [],
      canGenerate: false,
    };
    sell.writes = [{ status: 422, body: refusalWith('PROPOSAL_NOT_READY', { verdict }) }];
    const view = await mounted();

    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() =>
      expect(view.result.current.gate.failure).toEqual({ kind: 'not_ready', verdict }),
    );
    expect(view.result.current.gate.generated).toBeNull();
  });

  it('the plan’s limit is its own state, with when the cycle starts again', async () => {
    const blocked = {
      reason: 'cap',
      capability: 'sell_and_deliver',
      key: 'proposals_per_cycle',
      resetsAt: '2026-12-01T00:00:00.000Z',
    };
    sell.writes = [
      { status: 403, body: { error: { ...refusal('ENTITLEMENT_BLOCKED').error, blocked } } },
    ];
    const view = await mounted();

    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() =>
      expect(view.result.current.gate.failure).toEqual({ kind: 'billing', blocked }),
    );
    expect(view.result.current.gate.generated).toBeNull();
    // The builder draws this refusal as its own gate: the app's one denial stays shut (one message).
    expect(view.result.current.denial).toBeNull();
  });

  it('a proposal that is no longer a draft answers domain’s reason', async () => {
    sell.writes = [
      { status: 422, body: refusalWith('PROPOSAL_ACT_REFUSED', { refusal: 'lead_closed' }) },
    ];
    const view = await mounted();

    act(() => view.result.current.gate.generate(ASK));
    await waitFor(() =>
      expect(view.result.current.gate.failure).toEqual({ kind: 'refused', refusal: 'lead_closed' }),
    );
  });
});
