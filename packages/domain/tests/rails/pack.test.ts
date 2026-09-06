import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { mandateType } from '../../src/rails/ladder';
import { BILLING_CYCLES, IN_PAYMENT_RAILS, TIER_BANDS } from '../../src/rails/pack';

describe('IN_PAYMENT_RAILS — the India rails declaration (F1-40…F1-43)', () => {
  it('is the pack’s paymentRails key', () => {
    expect(IN_PACK.paymentRails).toBe(IN_PAYMENT_RAILS);
  });

  it('declares exactly the two validated mandate types — e-NACH is not one (F1-41)', () => {
    expect(IN_PAYMENT_RAILS.mandateTypes.map((mandate) => mandate.type)).toEqual([
      'upi_autopay',
      'card_emandate',
    ]);
  });

  it('caps a UPI AutoPay debit at ₹15,000 in paise, and caps the card fallback at nothing (F1-40)', () => {
    expect(mandateType(IN_PAYMENT_RAILS, 'upi_autopay')?.perDebitCap).toBe(1_500_000);
    expect(mandateType(IN_PAYMENT_RAILS, 'card_emandate')?.perDebitCap).toBeNull();
  });

  it('declares exactly the five IN payment modes, four of them manual (F1-42)', () => {
    expect(IN_PAYMENT_RAILS.paymentModes).toEqual([
      { mode: 'upi', manual: true },
      { mode: 'neft', manual: true },
      { mode: 'cheque', manual: true },
      { mode: 'cash', manual: true },
      { mode: 'payment_link', manual: false },
    ]);
  });

  it('names a reference implementation for every capability the product needs (F1-43)', () => {
    expect(IN_PAYMENT_RAILS.adapters).toEqual({
      subscription_billing: ['Razorpay'],
      payment_links: ['Razorpay'],
      otp_delivery: ['MSG91'],
      telephony: ['Exotel', 'Sarvam'],
    });
  });

  it('satisfies RBI localisation by construction — the aggregator holds the instruments (F1-43)', () => {
    expect(IN_PAYMENT_RAILS.localisation).toEqual({
      imposed: true,
      regime: 'RBI',
      satisfiedBy: 'aggregator_holds_instruments',
    });
  });

  it('rides only rails it declares — the ladder and the vocabulary cannot disagree (F1-18)', () => {
    const routes = TIER_BANDS.flatMap((band) =>
      BILLING_CYCLES.map((cycle) => IN_PAYMENT_RAILS.ladder[band][cycle]),
    );
    for (const route of routes) {
      if (route.collection !== 'mandate') continue;
      for (const rail of [route.primary, ...route.fallbacks]) {
        expect(mandateType(IN_PAYMENT_RAILS, rail)).not.toBeNull();
      }
    }
  });
});
