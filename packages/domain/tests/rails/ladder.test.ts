import { describe, expect, it } from 'vitest';
import { minorUnits } from '../../src/money/minor-units';
import { collectionRoute, fitsPerDebitCap, mandateType } from '../../src/rails/ladder';
import { IN_PAYMENT_RAILS, type MandateType } from '../../src/rails/pack';

const railFor = (type: string): MandateType => {
  const rail = mandateType(IN_PAYMENT_RAILS, type);
  if (rail === null) throw new Error(`the IN pack declares ${type}`);
  return rail;
};

describe('collectionRoute — the IN mandate ladder (F1-40)', () => {
  it('collects a self-serve month on UPI AutoPay, falling back to the card e-mandate', () => {
    expect(collectionRoute(IN_PAYMENT_RAILS, 'self_serve', 'monthly')).toEqual({
      collection: 'mandate',
      primary: 'upi_autopay',
      fallbacks: ['card_emandate'],
    });
  });

  /** A yearly total runs past the cap, and Enterprise is invoiced in either cycle. */
  it.each([
    ['self_serve', 'yearly'],
    ['enterprise', 'monthly'],
    ['enterprise', 'yearly'],
  ] as const)('collects %s %s on one payment link, establishing no mandate', (band, cycle) => {
    expect(collectionRoute(IN_PAYMENT_RAILS, band, cycle)).toEqual({ collection: 'invoice' });
  });
});

describe('mandateType — the open-set validation (F1-09)', () => {
  it('reads back a type the market declares', () => {
    expect(mandateType(IN_PAYMENT_RAILS, 'upi_autopay')?.type).toBe('upi_autopay');
  });

  it('refuses a type the market does not declare, e-NACH among them (F1-41)', () => {
    expect(mandateType(IN_PAYMENT_RAILS, 'enach')).toBeNull();
    expect(mandateType(IN_PAYMENT_RAILS, 'sepa_direct_debit')).toBeNull();
  });
});

describe('fitsPerDebitCap — what shapes the ladder (F1-40)', () => {
  const upiAutopay = railFor('upi_autopay');

  it.each([
    [199_900, true, 'the Starter month, ₹1,999'],
    [999_900, true, 'the Pro month, ₹9,999'],
    [1_500_000, true, 'exactly the ₹15,000 cap'],
    [1_500_001, false, 'one paisa past the cap'],
    [2_358_820, false, 'a Starter year at ₹19,990 + 18% GST'],
  ])('a debit of %d paise fits UPI AutoPay: %s — %s', (amount, expected) => {
    expect(fitsPerDebitCap(upiAutopay, minorUnits(amount))).toBe(expected);
  });

  it('lets any amount ride a rail that declares no cap', () => {
    expect(fitsPerDebitCap(railFor('card_emandate'), minorUnits(9_999_999))).toBe(true);
  });
});
