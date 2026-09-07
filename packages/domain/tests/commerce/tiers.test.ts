import { describe, expect, it } from 'vitest';
import { TIERS, tierBand } from '../../src/commerce/tiers';
import { collectionRoute } from '../../src/rails/ladder';
import { IN_PAYMENT_RAILS, TIER_BANDS } from '../../src/rails/pack';

describe('tierBand — which band buys this tier (BM-11, BM-14, BM-15, F1-18)', () => {
  it.each([
    { tier: 'starter', band: 'self_serve', rung: 'the entry rung, bought in the product' },
    { tier: 'growth', band: 'self_serve', rung: 'the default recommendation, still self-serve' },
    { tier: 'pro', band: 'self_serve', rung: 'the C&I rung — bigger, still bought not sold' },
    { tier: 'enterprise', band: 'enterprise', rung: 'the one rung sold, on an annual contract' },
  ] as const)('routes $tier to $band — $rung', ({ tier, band }) => {
    expect(tierBand(tier)).toBe(band);
  });

  it('sells exactly one tier, so every other rung stays buyable without a salesperson (BM-08)', () => {
    expect(TIERS.filter((tier) => tierBand(tier) === 'enterprise')).toEqual(['enterprise']);
  });

  it('lands every tier on a band the rails vocabulary declares (F1-18)', () => {
    for (const tier of TIERS) {
      expect(TIER_BANDS).toContain(tierBand(tier));
    }
  });

  it('gives every tier a collection route on both cycles — no rung is unsellable (BM-13)', () => {
    for (const tier of TIERS) {
      expect(collectionRoute(IN_PAYMENT_RAILS, tierBand(tier), 'monthly')).toBeDefined();
      expect(collectionRoute(IN_PAYMENT_RAILS, tierBand(tier), 'yearly')).toBeDefined();
    }
  });
});
