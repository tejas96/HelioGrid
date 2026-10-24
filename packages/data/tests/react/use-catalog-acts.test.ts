// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type CatalogActNote, useCatalogActs } from '../../src/react/use-catalog-acts';
import { useCatalogPriceDraft } from '../../src/react/use-catalog-price-draft';
import { useSession } from '../../src/react/use-session';
import { mountedOver, OWN_SKU, origin, refusal } from './catalog-origin';

/** Catalog settings' row acts through the real client: every answer a write can meet. */
describe('Catalog settings row acts, through the real client', () => {
  const mounted = async () => {
    const notes: CatalogActNote[] = [];
    const view = mountedOver(() => ({
      session: useSession(),
      acts: useCatalogActs((note) => notes.push(note)),
    }));
    await waitFor(() => expect(view.result.current.session.user?.tenant?.id).toBeTruthy());
    return Object.assign(view, { notes });
  };

  it('archive then undo restores the item', async () => {
    const view = await mounted();
    act(() => view.result.current.acts.archive(OWN_SKU));
    await waitFor(() => expect(view.notes[0]?.kind).toBe('archived'));
    expect(origin.item.archived).toBe(true);
    const archived = view.notes[0];
    act(() => {
      if (archived?.kind === 'archived') archived.undo();
    });
    await waitFor(() => expect(origin.item.archived).toBe(false));
    expect(origin.sent).toEqual(['POST archive', 'POST unarchive']);
  });

  it('a second tap sends one write', async () => {
    const view = await mounted();
    act(() => {
      view.result.current.acts.togglePreferred(OWN_SKU);
      view.result.current.acts.togglePreferred(OWN_SKU);
    });
    await waitFor(() => expect(view.result.current.acts.rows[OWN_SKU.id]).toBeUndefined());
    expect(origin.sent).toEqual(['PUT item']);
  });

  it('a failed save keeps the old value', async () => {
    const view = await mounted();
    origin.writes = [{ status: 500, body: refusal('INTERNAL') }];
    act(() => view.result.current.acts.archive(OWN_SKU));
    await waitFor(() =>
      expect(view.result.current.acts.rows[OWN_SKU.id]).toMatchObject({
        state: 'failed',
        act: 'archive',
      }),
    );
    expect(origin.item.archived).toBe(false);
    expect(view.notes).toEqual([]);
    act(() => {
      const row = view.result.current.acts.rows[OWN_SKU.id];
      if (row?.state === 'failed') row.retry();
    });
    await waitFor(() => expect(view.notes[0]?.kind).toBe('archived'));
    expect(view.result.current.acts.rows[OWN_SKU.id]).toBeUndefined();
  });

  it.each([
    [422, 'refused'],
    [500, 'failed'],
  ] as const)('a price save answered %i is %s', async (status, outcome) => {
    const view = await mounted();
    origin.writes = [
      { status, body: refusal(status === 422 ? 'DOMAIN_RULE_VIOLATION' : 'INTERNAL') },
    ];
    let saved = '';
    await act(async () => {
      saved = await view.result.current.acts.savePrice(OWN_SKU, { amount: '13000' });
    });
    expect(saved).toBe(outcome);
  });

  it('an own SKU price is a dated entry', async () => {
    const view = await mounted();
    let saved = '';
    await act(async () => {
      saved = await view.result.current.acts.savePrice(OWN_SKU, { amount: '13000' });
    });
    expect(saved).toBe('saved');
    expect(origin.sent).toEqual(['POST rate-entries']);
  });

  it.each([
    ['the same figure', '12500', []],
    ['the same figure written as the wire writes it', '12500.00', []],
    ['a new figure', '13000', ['POST rate-entries']],
  ])('an editor save writes a price only when it moves (%s)', async (_case, typed, sent) => {
    const view = mountedOver(() => {
      const acts = useCatalogActs(() => undefined);
      return { draft: useCatalogPriceDraft(acts) };
    });
    act(() => view.result.current.draft.open(OWN_SKU));
    act(() => view.result.current.draft.setAmount(typed));
    await act(async () => {
      await view.result.current.draft.save();
    });
    expect(origin.sent).toEqual(sent);
  });

  it.each([
    ['5', '5.00'],
    ['5.5', '5.50'],
  ])('a typed tax travels as the wire writes it (%s)', async (typed, wire) => {
    const platform = {
      ...OWN_SKU,
      source: 'platform_item' as const,
      provenance: 'representative' as const,
      rate: null,
    };
    origin.item = structuredClone(platform);
    const view = mountedOver(() => {
      const acts = useCatalogActs(() => undefined);
      return { draft: useCatalogPriceDraft(acts) };
    });
    act(() => view.result.current.draft.open(platform));
    act(() => view.result.current.draft.setTaxPct(typed));
    await act(async () => {
      await view.result.current.draft.save();
    });
    expect(origin.sent).toEqual(['PUT override']);
    expect(origin.bodies[0]).toMatchObject({ taxPct: wire });
    expect(view.result.current.draft.problem).toBeNull();
  });
});
