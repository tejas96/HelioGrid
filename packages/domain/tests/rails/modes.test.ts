import { describe, expect, it } from 'vitest';
import { availablePaymentModes, paymentMode } from '../../src/rails/modes';
import { IN_PAYMENT_RAILS } from '../../src/rails/pack';

const modeNames = (railAvailable: boolean) =>
  availablePaymentModes(IN_PAYMENT_RAILS, railAvailable).map((mode) => mode.mode);

describe('paymentMode — the open-set validation (F1-09, F1-42)', () => {
  it.each(['upi', 'neft', 'cheque', 'cash'])(
    'reads back %s, a mode the IN market declares',
    (mode) => {
      expect(paymentMode(IN_PAYMENT_RAILS, mode)?.mode).toBe(mode);
    },
  );

  it('refuses a mode the market does not declare', () => {
    expect(paymentMode(IN_PAYMENT_RAILS, 'ach')).toBeNull();
  });

  it('no longer declares a payment link — there is no link rail (owner ruling 2026-11-11)', () => {
    expect(paymentMode(IN_PAYMENT_RAILS, 'payment_link')).toBeNull();
  });
});

describe('availablePaymentModes — the rail is an accelerator, never a dependency (F1-42)', () => {
  it('offers the four manual modes whether or not a rail answers', () => {
    expect(modeNames(true)).toEqual(['upi', 'neft', 'cheque', 'cash']);
    expect(modeNames(false)).toEqual(['upi', 'neft', 'cheque', 'cash']);
  });

  it('never returns an empty set, whatever the rail does — a tenant always collects', () => {
    expect(availablePaymentModes(IN_PAYMENT_RAILS, false).length).toBeGreaterThan(0);
  });
});
