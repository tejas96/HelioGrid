// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCollectionsSettings } from '../../src/react/use-collections-settings';
import { useTenantId } from '../../src/react/use-tenant-id';
import { refusal } from './origin-wire';
import { answerNext, mountedOver, NO_MONEY_DUE, origin, readsOf, settle } from './payments-origin';

/**
 * How customers pay you (`SCR-M11-04`) through the real client: only a person whose presets open
 * the row reads it, and a UPI ID the api refuses is said at the field.
 */

const WRITE = { upiId: 'new@okicici', payee: 'Sun EPC' };

describe('Collections settings', () => {
  it('a person the row does not open reads nothing', async () => {
    origin.roles = [NO_MONEY_DUE];
    const view = mountedOver(() => ({ page: useCollectionsSettings(), tenant: useTenantId() }));
    await waitFor(() => expect(view.result.current.tenant).not.toBe(''));
    await settle();
    expect(view.result.current.page.allowed).toBe(false);
    expect(readsOf('/settings/collections')).toEqual([]);
  });

  it('a save lands and the page shows what was saved', async () => {
    const view = mountedOver(() => useCollectionsSettings());
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    expect(view.result.current.changed).toBe(false);
    act(() => view.result.current.edit({ upiId: ' new@okicici ' }));
    expect(view.result.current.changed).toBe(true);
    let saved = false;
    await act(async () => {
      saved = await view.result.current.save();
    });
    expect(view.result.current.changed).toBe(false);
    expect(saved).toBe(true);
    expect(origin.writes).toEqual([
      { path: '/settings/collections', body: WRITE, key: expect.any(String) },
    ]);
    const { read } = view.result.current;
    expect(read.kind === 'ready' ? read.value.payTo.upiId : null).toBe('new@okicici');
  });

  it.each([
    ['a malformed UPI ID', 422, 'UPI_ID_MALFORMED', 'malformed'],
    ['any other failure', 500, 'INTERNAL', 'failed'],
  ])('%s is said as %s', async (_, status, code, said) => {
    answerNext('collections', { status, body: refusal(code) });
    const view = mountedOver(() => useCollectionsSettings());
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    act(() => view.result.current.edit(WRITE));
    await act(async () => {
      await view.result.current.save();
    });
    expect(view.result.current.failure).toBe(said);
  });
});

describe('Collections settings — what may be saved', () => {
  it.each([
    ['nothing typed', {}, false],
    ['the saved values typed again', { upiId: 'epc@okaxis', payee: 'Sun EPC' }, false],
    ['a new UPI ID', { upiId: 'new@okicici' }, true],
    ['the UPI ID taken away', { upiId: '  ' }, true],
    ['no shown name', { payee: ' ' }, false],
  ])('%s → %s', async (_, typed, changed) => {
    const view = mountedOver(() => useCollectionsSettings());
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    if (Object.keys(typed).length > 0) act(() => view.result.current.edit(typed));
    expect(view.result.current.changed).toBe(changed);
  });
});
