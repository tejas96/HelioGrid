// @vitest-environment happy-dom
import { AMOUNT_WHOLE_DIGITS_MAX } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bodies, mounted, readyOf, type Screen, stepOf } from './proposal-builder-mounted';
import { sell } from './proposals-origin';

/**
 * A typed amount past the contract's whole digits (`amountSchema`) is held as typed and said at its
 * field, and never sent: the builder's view model never throws on what a person typed.
 */

const LARGEST = 10 ** AMOUNT_WHOLE_DIGITS_MAX - 1;
const PAST = 10 ** AMOUNT_WHOLE_DIGITS_MAX;
const LIVE_QA = 200003000030000;

type Typed = { step: 'system' | 'financials'; type: (screen: Screen, figure: number) => void };

const FIELDS: Record<string, Typed & { key: string; shown: (screen: Screen) => unknown }> = {
  price: {
    step: 'system',
    key: 'price',
    type: (screen, figure) => stepOf(screen, 'system').onPrice(figure),
    shown: (screen) => stepOf(screen, 'system').priceInclusive,
  },
  discount: {
    step: 'system',
    key: 'discount',
    type: (screen, figure) =>
      stepOf(screen, 'system').onDiscount({ mode: 'amount', value: figure }),
    shown: (screen) => stepOf(screen, 'system').discount.value,
  },
  battery: {
    step: 'system',
    key: 'batteryCost',
    type: (screen, figure) =>
      stepOf(screen, 'system').onBattery({
        capacityKwh: 5,
        cost: figure,
        chemistry: 'lfp',
        chemistryCustom: null,
      }),
    shown: (screen) => stepOf(screen, 'system').battery?.cost,
  },
  bill: {
    step: 'financials',
    key: 'monthlyBill',
    type: (screen, figure) => stepOf(screen, 'financials').onMonthlyBill(figure),
    shown: (screen) => stepOf(screen, 'financials').monthlyBill,
  },
};

function saveOf(screen: Screen, key: string) {
  const step = readyOf(screen).step as { saves?: Record<string, { kind: string } | undefined> };
  return step.saves?.[key] ?? null;
}

describe('a typed amount past the contract’s whole digits is held, said, and not sent', () => {
  it.each(
    Object.keys(FIELDS).flatMap((field) => [
      [field, PAST],
      [field, LIVE_QA],
    ]),
  )('%s at %d is held as typed, refused at its field, never sent', async (field, figure) => {
    const typed = FIELDS[field];
    if (typed === undefined) throw new Error(field);
    const { view } = await mounted(typed.step);

    act(() => typed.type(view.result.current, figure));

    expect(typed.shown(view.result.current)).toBe(figure);
    expect(saveOf(view.result.current, typed.key)).toMatchObject({
      kind: 'refused',
      failure: { kind: 'refused', refusal: 'amount_too_large' },
    });
    expect(readyOf(view.result.current).frame.recomputing).toBe(false);
    expect(sell.sent).toHaveLength(0);
  });

  it.each(Object.keys(FIELDS))(
    '%s at the largest amount the contract takes is sent',
    async (field) => {
      const typed = FIELDS[field];
      if (typed === undefined) throw new Error(field);
      const { view } = await mounted(typed.step);

      act(() => typed.type(view.result.current, LARGEST));
      await waitFor(() => expect(sell.sent).toHaveLength(1));

      expect(JSON.stringify(bodies()[0])).toContain(`"${String(LARGEST)}.00"`);
    },
  );

  it('a held amount typed again within the limit is sent, and the refusal goes', async () => {
    const { view } = await mounted('system');

    act(() => stepOf(view.result.current, 'system').onPrice(PAST));
    act(() => stepOf(view.result.current, 'system').onPrice(200000));
    await waitFor(() => expect(sell.sent).toHaveLength(1));

    expect(bodies()[0]).toMatchObject({ fields: { system: { priceInclusive: '200000.00' } } });
    expect(stepOf(view.result.current, 'system').saves.price?.kind).not.toBe('refused');
  });
});
