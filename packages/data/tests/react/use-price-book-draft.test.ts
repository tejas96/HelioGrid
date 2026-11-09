// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePriceBook } from '../../src/react/use-price-book';
import { usePriceBookDraft } from '../../src/react/use-price-book-draft';
import { mountedOver, origin } from './catalog-origin';

/** The new price-book version's draft (`M01-48`), sent through the real client. */
describe('the new price-book version, through the real client', () => {
  const mounted = async () => {
    origin.book = {
      ...origin.book,
      version: {
        id: '01a20000-0000-7000-8000-000000000207',
        number: 7,
        publishedAt: '2026-08-12T10:00:00.000Z',
        publishedBy: { id: '01a20000-0000-7000-8000-000000000002', name: 'Rajesh Sharma' },
        note: 'Installation above 10 kW moved to a per-kW rate.',
      },
      rates: [{ name: 'Site survey visit', basis: 'per_visit', amount: '1200' }],
    };
    const view = mountedOver(() => ({ book: usePriceBook(), draft: usePriceBookDraft() }));
    await waitFor(() => expect(view.result.current.book.kind).toBe('ready'));
    act(() => {
      const { book } = view.result.current;
      if (book.kind === 'ready') view.result.current.draft.start(book.value);
    });
    return view;
  };

  it('starts from the version in force', async () => {
    const view = await mounted();
    expect(view.result.current.draft.from).toBe(7);
    expect(view.result.current.draft.rows[0]).toMatchObject({
      name: 'Site survey visit',
      was: '1200',
    });
  });

  it('an empty note is named only once it is the one thing missing', async () => {
    const view = await mounted();
    expect(view.result.current.draft.noteMissing).toBe(true);
    act(() => view.result.current.draft.setNote('Survey raised.'));
    expect(view.result.current.draft.noteMissing).toBe(false);
    act(() => {
      view.result.current.draft.setNote('');
      view.result.current.draft.setMargin('');
    });
    expect(view.result.current.draft.noteMissing).toBe(false);
  });

  it('a rate added then cancelled leaves no row', async () => {
    const view = await mounted();
    act(() => view.result.current.draft.addRate());
    expect(view.result.current.draft.editing?.added).toBe(true);
    act(() => view.result.current.draft.setEditName('Cable tray'));
    act(() => view.result.current.draft.cancelEdit());
    expect(view.result.current.draft.editing).toBeNull();
    expect(view.result.current.draft.rows).toHaveLength(1);
  });

  it('cancel keeps the rate as it was', async () => {
    const view = await mounted();
    const key = view.result.current.draft.rows[0]?.key ?? '';
    act(() => view.result.current.draft.edit(key));
    act(() => {
      view.result.current.draft.setEditName('Survey visit, renamed');
      view.result.current.draft.setEditBasis('per_job');
    });
    act(() => view.result.current.draft.cancelEdit());
    expect(view.result.current.draft.rows[0]).toMatchObject({
      name: 'Site survey visit',
      basis: 'per_visit',
    });
  });

  it("done keeps the sheet's name and basis", async () => {
    const view = await mounted();
    act(() => view.result.current.draft.addRate());
    act(() => {
      view.result.current.draft.setEditName('केबल ट्रे');
      view.result.current.draft.setEditBasis('per_metre');
    });
    act(() => view.result.current.draft.doneEdit());
    expect(view.result.current.draft.rows[1]).toMatchObject({
      name: 'केबल ट्रे',
      basis: 'per_metre',
      amount: '',
      was: null,
    });
  });

  it.each([
    ['empty', ''],
    ['only spaces', '   '],
  ])('a rate whose name is %s cannot leave the sheet', async (_case, name) => {
    const view = await mounted();
    act(() => view.result.current.draft.addRate());
    act(() => view.result.current.draft.setEditName(name));
    expect(view.result.current.draft.editing?.nameless).toBe(true);
    act(() => view.result.current.draft.doneEdit());
    expect(view.result.current.draft.editing).not.toBeNull();
    expect(view.result.current.draft.rows).toHaveLength(1);
  });

  it('remove drops the edited rate', async () => {
    const view = await mounted();
    const key = view.result.current.draft.rows[0]?.key ?? '';
    act(() => view.result.current.draft.edit(key));
    act(() => view.result.current.draft.removeEdited());
    expect(view.result.current.draft.rows).toHaveLength(0);
    expect(view.result.current.draft.editing).toBeNull();
  });

  it('a renamed rate travels as written, trimmed', async () => {
    const view = await mounted();
    const key = view.result.current.draft.rows[0]?.key ?? '';
    act(() => view.result.current.draft.setNote('Survey named in Hindi.'));
    act(() => view.result.current.draft.edit(key));
    act(() => view.result.current.draft.setEditName('  साइट सर्वे '));
    act(() => view.result.current.draft.doneEdit());
    let number: number | null = null;
    await act(async () => {
      number = await view.result.current.draft.publish();
    });
    expect(number).toBe(8);
    expect(origin.book.rates[0]?.name).toBe('साइट सर्वे');
  });

  it('a typed margin travels as the wire writes it', async () => {
    const view = await mounted();
    act(() => {
      view.result.current.draft.setNote('Margin raised.');
      view.result.current.draft.setMargin('18');
    });
    let number: number | null = null;
    await act(async () => {
      number = await view.result.current.draft.publish();
    });
    expect(number).toBe(8);
    expect(origin.bodies[0]).toMatchObject({ defaultMarginPct: '18.00' });
  });
});
