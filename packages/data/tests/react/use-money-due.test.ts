// @vitest-environment happy-dom
import { MAX_PAGE_LIMIT } from '@heliogrid/contracts';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MONEY_DUE_SHOWN, useMoneyDue } from '../../src/react/use-money-due';
import { useTenantId } from '../../src/react/use-tenant-id';
import { moneyDueOf, mountedOver, NO_MONEY_DUE, origin, readsOf, settle } from './payments-origin';

/**
 * Money due (`SCR-M11-01`) through the real client: read only on a home that holds it, in one page,
 * grouped late, due today and part paid, each group showing its first few until *Show all*.
 */

describe('Money due — who reads it', () => {
  it('a home without it reads nothing', async () => {
    origin.roles = [NO_MONEY_DUE];
    const view = mountedOver(() => ({ due: useMoneyDue(), tenant: useTenantId() }));
    await waitFor(() => expect(view.result.current.tenant).not.toBe(''));
    await settle();
    expect(view.result.current.due.shown).toBe(false);
    expect(readsOf('/payments/due')).toEqual([]);
  });
});

describe('Money due — the groups shown', () => {
  it('reads the largest page once, and groups it late, due today, part paid — an empty group left out', async () => {
    origin.due = moneyDueOf(2, 0, 1);
    const view = mountedOver(() => useMoneyDue());
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    expect(readsOf('/payments/due')).toEqual([`GET /payments/due?page=1&limit=${MAX_PAGE_LIMIT}`]);
    expect(view.result.current.groups.map((group) => [group.group, group.rows.length])).toEqual([
      ['late', 2],
      ['part', 1],
    ]);
  });

  it.each([
    ['as many as a group shows: all of them, nothing hidden', MONEY_DUE_SHOWN, MONEY_DUE_SHOWN, 0],
    ['one more: the first few, and Show all for the rest', MONEY_DUE_SHOWN + 1, MONEY_DUE_SHOWN, 1],
  ])('%s', async (_, late, shown, hidden) => {
    origin.due = moneyDueOf(late, 0, 0);
    const view = mountedOver(() => useMoneyDue());
    await waitFor(() => expect(view.result.current.groups).toHaveLength(1));
    expect(view.result.current.groups[0]).toMatchObject({ hidden });
    expect(view.result.current.groups[0]?.rows).toHaveLength(shown);
  });

  it('Show all opens that group alone', async () => {
    origin.due = moneyDueOf(MONEY_DUE_SHOWN + 2, MONEY_DUE_SHOWN + 1, 0);
    const view = mountedOver(() => useMoneyDue());
    await waitFor(() => expect(view.result.current.groups).toHaveLength(2));
    act(() => view.result.current.expand('due'));
    const [late, due] = view.result.current.groups;
    expect([late?.rows.length, late?.hidden]).toEqual([MONEY_DUE_SHOWN, 2]);
    expect([due?.rows.length, due?.hidden]).toEqual([MONEY_DUE_SHOWN + 1, 0]);
  });

  it('a group the first page has no room for is read on its own', async () => {
    origin.due = moneyDueOf(MAX_PAGE_LIMIT, 1, 0);
    const view = mountedOver(() => useMoneyDue());
    await waitFor(() =>
      expect(view.result.current.groups.map((group) => group.group)).toEqual(['late', 'due']),
    );
    await waitFor(() => expect(view.result.current.groups[1]?.rows).toHaveLength(1));
    expect(readsOf('/payments/due').some((one) => one.includes('group=due'))).toBe(true);
    expect(view.result.current.groups[0]).toMatchObject({
      hidden: MAX_PAGE_LIMIT - MONEY_DUE_SHOWN,
    });
  });
});
