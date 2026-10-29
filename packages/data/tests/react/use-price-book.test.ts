// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePriceBook, usePublishPriceBookVersion } from '../../src/react/use-price-book';
import { mountedOver } from './catalog-origin';

/** The price book through the real client: a new version is the one in force once it lands. */
describe('the price book, through the real client', () => {
  it('a published version becomes the active one', async () => {
    const told: number[] = [];
    const view = mountedOver(() => ({
      book: usePriceBook(),
      publish: usePublishPriceBookVersion((number) => told.push(number)),
    }));
    const active = () => {
      const { book } = view.result.current;
      return book.kind === 'ready' ? book.value : undefined;
    };
    await waitFor(() => expect(active()?.version).toBeNull());
    await act(async () => {
      await view.result.current.publish.run({
        note: 'First rates',
        defaultMarginPct: '16.50',
        rates: [{ name: { en: 'Site survey' }, basis: 'per_visit', amount: '1500' }],
      });
    });
    expect(told).toEqual([1]);
    await waitFor(() => expect(active()?.version?.number).toBe(1));
    expect(active()?.rates).toHaveLength(1);
  });
});
