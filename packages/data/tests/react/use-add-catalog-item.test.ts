// @vitest-environment happy-dom
import type { CatalogItemWire } from '@heliogrid/contracts';
import { NO_CATALOG_FILTER } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAddCatalogItem } from '../../src/react/use-add-catalog-item';
import { useCatalogPage } from '../../src/react/use-catalog-items';
import { useSession } from '../../src/react/use-session';
import { mountedOver, OWN_SKU, origin, refusal } from './catalog-origin';

const SAATVIK: Record<string, number | string> = {
  watt: 575,
  technology: 'mono_perc',
  lengthMm: 2278,
  widthMm: 1134,
  vocV: 51.6,
  vmpV: 43.4,
  iscA: 14,
  impA: 13.25,
  tempCoeffVocPct: -0.27,
};

/** The add sheet's write through the real client: every answer a create can meet. */
describe('adding an own item, through the real client', () => {
  const mounted = async (priced = true, fromItemId: string | null = null) => {
    const added: CatalogItemWire[] = [];
    const closed: boolean[] = [];
    const view = mountedOver(() => ({
      session: useSession(),
      add: useAddCatalogItem({
        kind: 'panel',
        priced,
        fromItemId,
        onAdded: (item) => added.push(item),
        onClose: () => closed.push(true),
        onSpreadsheet: () => {},
      }),
    }));
    await waitFor(() => expect(view.result.current.session.user?.tenant?.id).toBeTruthy());
    await waitFor(() => expect(view.result.current.add.form.schemes).toHaveLength(2));
    return Object.assign(view, { added, closed });
  };
  const fill = (view: Awaited<ReturnType<typeof mounted>>, price = '15650') =>
    act(() => {
      const change = view.result.current.add.form.onChange;
      change({ type: 'brand', value: 'Saatvik' });
      change({ type: 'model', value: 'SGP-575-BAA-HC' });
      for (const [path, value] of Object.entries(SAATVIK)) change({ type: 'spec', path, value });
      change({ type: 'scheme', scheme: 'DCR', on: true });
      change({ type: 'price', value: price });
    });

  it('a retried create sends the same key', async () => {
    const view = await mounted();
    fill(view);
    origin.writes = [{ status: 500, body: refusal('INTERNAL') }];
    await act(() => view.result.current.add.submit());
    expect(view.result.current.add.form.returned).toBe(true);
    expect(view.result.current.add.form.draft.brand).toBe('Saatvik');
    await act(() => view.result.current.add.submit());
    expect(origin.sent).toEqual(['POST create', 'POST create']);
    expect(origin.keys[0]).not.toBe('');
    expect(origin.keys[1]).toBe(origin.keys[0]);
    expect(view.added).toHaveLength(1);
    expect(view.result.current.add.form.returned).toBe(false);
  });

  it('a second press while one is out sends nothing', async () => {
    const view = await mounted();
    fill(view);
    await act(async () => {
      await Promise.all([view.result.current.add.submit(), view.result.current.add.submit()]);
    });
    expect(origin.sent).toEqual(['POST create']);
    expect(view.added).toHaveLength(1);
  });

  it('a 400 maps each path to its field', async () => {
    const view = await mounted();
    fill(view);
    origin.writes = [
      {
        status: 400,
        body: {
          error: {
            code: 'VALIDATION_FAILED',
            message: 'x',
            requestId: 'test',
            details: [{ path: 'brand', issue: 'too_long' }],
          },
        },
      },
    ];
    await act(() => view.result.current.add.submit());
    expect(view.result.current.add.failures).toEqual([{ path: 'brand', issue: 'invalid' }]);
    expect(view.result.current.add.form.returned).toBe(false);
  });

  it.each([
    ['certifications.0.reference', [{ path: 'certifications.DCR', issue: 'invalid' }], false],
    ['preferred', [], true],
  ])('a 422 at %s lands on its field or the returned line', async (path, failures, returned) => {
    const view = await mounted();
    fill(view);
    origin.writes = [
      {
        status: 422,
        body: {
          error: {
            code: 'DOMAIN_RULE_VIOLATION',
            message: 'x',
            requestId: 't',
            details: [{ path, issue: 'undeclared' }],
          },
        },
      },
    ];
    await act(() => view.result.current.add.submit());
    expect(view.result.current.add.failures).toEqual(failures);
    expect(view.result.current.add.form.returned).toBe(returned);
  });

  it('offers the spreadsheet only to a person who may price', async () => {
    expect((await mounted(true)).result.current.add.form.onSpreadsheet).not.toBeNull();
    expect((await mounted(false)).result.current.add.form.onSpreadsheet).toBeNull();
  });

  it('refuses on the device before anything is sent', async () => {
    const view = await mounted();
    await act(() => view.result.current.add.submit());
    expect(view.result.current.add.failures.map((failure) => failure.path)).toContain('brand');
    expect(origin.sent).toEqual([]);
  });

  it('a 201 invalidates the catalog', async () => {
    const view = mountedOver(() => ({
      session: useSession(),
      page: useCatalogPage({ q: '', filter: NO_CATALOG_FILTER, sort: 'preferred' }, 1),
      add: useAddCatalogItem({
        kind: 'panel',
        priced: true,
        onAdded: () => {},
        onClose: () => {},
        onSpreadsheet: () => {},
      }),
    }));
    await waitFor(() => expect(view.result.current.page.items).toHaveLength(1));
    await waitFor(() => expect(view.result.current.add.form.schemes).toHaveLength(2));
    origin.item = { ...OWN_SKU, brand: 'Saatvik' };
    act(() => {
      const change = view.result.current.add.form.onChange;
      change({ type: 'brand', value: 'Saatvik' });
      change({ type: 'model', value: 'SGP-575-BAA-HC' });
      for (const [path, value] of Object.entries(SAATVIK)) change({ type: 'spec', path, value });
    });
    await act(() => view.result.current.add.submit());
    await waitFor(() => expect(view.result.current.page.items[0]?.brand).toBe('Saatvik'));
  });

  it.each([
    [true, '15650', { amount: '15650' }],
    [false, '15650', undefined],
    [true, '', undefined],
  ])('sends no rate unless priced (priced %s, price "%s")', async (priced, price, rate) => {
    const view = await mounted(priced);
    fill(view, price);
    await act(() => view.result.current.add.submit());
    const body = origin.bodies[0] as {
      rate?: unknown;
      certifications: unknown;
      preferred: boolean;
    };
    expect(body.rate).toEqual(rate);
    expect(body.certifications).toEqual([{ scheme: 'DCR', reference: null }]);
    expect(body.preferred).toBe(false);
  });

  it('reads a selected item into the form, and asks before leaving once it changes', async () => {
    const view = await mounted(true, OWN_SKU.id);
    await waitFor(() => expect(view.result.current.add.form.loading).toBe(false));
    expect(view.result.current.add.copiedFrom).toBe('Own Panels OP-550');
    expect(view.result.current.add.form.draft.spec.watt).toBe(550);
    act(() => view.result.current.add.form.onCancel());
    expect(view.closed).toEqual([true]);
    act(() => view.result.current.add.form.onChange({ type: 'model', value: 'OP-550-B' }));
    act(() => view.result.current.add.form.onCancel());
    expect(view.result.current.add.confirming).toBe(true);
    expect(view.closed).toEqual([true]);
    act(() => view.result.current.add.form.onKeep());
    expect(view.result.current.add.confirming).toBe(false);
    expect(view.result.current.add.form.draft.model).toBe('OP-550-B');
  });
});

describe('the list with an item just added', () => {
  it('the pinned item is listed once', async () => {
    const { openDraftCount: _drafts, ...listed } = OWN_SKU;
    const fresh = { ...listed, id: '01a20000-0000-7000-8000-000000000999', brand: 'Fresh' };
    const view = mountedOver(() =>
      useCatalogPage({ q: '', filter: NO_CATALOG_FILTER, sort: 'preferred' }, 1, fresh),
    );
    await waitFor(() => expect(view.result.current.items).toHaveLength(2));
    expect(view.result.current.items.map((item) => item.brand)).toEqual(['Fresh', 'Own Panels']);
    origin.item = { ...OWN_SKU, preferred: true };
    const fresh2 = mountedOver(() =>
      useCatalogPage({ q: '', filter: NO_CATALOG_FILTER, sort: 'preferred' }, 1, listed),
    );
    await waitFor(() => expect(fresh2.result.current.items[0]?.preferred).toBe(true));
    origin.item = OWN_SKU;
    view.rerender();
    const again = mountedOver(() =>
      useCatalogPage({ q: '', filter: NO_CATALOG_FILTER, sort: 'preferred' }, 1, listed),
    );
    await waitFor(() => expect(again.result.current.items).toHaveLength(1));
    expect(again.result.current.items[0]?.id).toBe(OWN_SKU.id);
  });
});
