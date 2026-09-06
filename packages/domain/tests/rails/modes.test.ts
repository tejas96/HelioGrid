import { describe, expect, it } from 'vitest';
import { availablePaymentModes, paymentMode } from '../../src/rails/modes';
import { IN_PAYMENT_RAILS } from '../../src/rails/pack';

const modeNames = (railAvailable: boolean) =>
  availablePaymentModes(IN_PAYMENT_RAILS, railAvailable).map((mode) => mode.mode);

describe('paymentMode — the open-set validation (F1-09, F1-42)', () => {
  it.each(['upi', 'neft', 'cheque', 'cash', 'payment_link'])(
    'reads back %s, a mode the IN market declares',
    (mode) => {
      expect(paymentMode(IN_PAYMENT_RAILS, mode)?.mode).toBe(mode);
    },
  );

  it('refuses a mode the market does not declare', () => {
    expect(paymentMode(IN_PAYMENT_RAILS, 'ach')).toBeNull();
  });

  it('marks the link rail as the one non-manual mode', () => {
    expect(paymentMode(IN_PAYMENT_RAILS, 'payment_link')?.manual).toBe(false);
    expect(paymentMode(IN_PAYMENT_RAILS, 'cash')?.manual).toBe(true);
  });
});

describe('availablePaymentModes — the rail is an accelerator, never a dependency (F1-42)', () => {
  it('offers every mode while the rail is reachable', () => {
    expect(modeNames(true)).toEqual(['upi', 'neft', 'cheque', 'cash', 'payment_link']);
  });

  it('keeps all four manual modes when the rail is gone, dropping only link-minting', () => {
    expect(modeNames(false)).toEqual(['upi', 'neft', 'cheque', 'cash']);
  });

  it('never returns an empty set, whatever the rail does — a tenant always collects', () => {
    expect(availablePaymentModes(IN_PAYMENT_RAILS, false).length).toBeGreaterThan(0);
  });
});
