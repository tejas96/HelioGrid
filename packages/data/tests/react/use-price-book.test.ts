// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePriceBook, usePublishPriceBookVersion } from '../../src/react/use-price-book';
import { mountedOver } from './catalog-origin';

/** The price book through the real client: a new version is the one in force once it lands. */
describe('the price book, through the real client', () => {
  it('a published version becomes the active one', async () => {
    const view = mountedOver(() => ({
      book: usePriceBook(),
      publish: usePublishPriceBookVersion(),
    }));
    await waitFor(() => expect(view.result.current.book.data?.version).toBeNull());
    let number: number | null = null;
    await act(async () => {
      number = await view.result.current.publish.publish({
        note: 'First rates',
        defaultMarginPct: '16.50',
        rates: [{ name: { en: 'Site survey' }, basis: 'per_visit', amount: '1500' }],
      });
    });
    expect(number).toBe(1);
    await waitFor(() => expect(view.result.current.book.data?.version?.number).toBe(1));
    expect(view.result.current.book.data?.rates).toHaveLength(1);
  });
});
