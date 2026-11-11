import { describe, expect, it } from 'vitest';
import { activeProjectsBlock, planChangeKindOf, tierStepOf } from '../../src/commerce/plan-change';
import { appliesImmediately } from '../../src/commerce/repricing';
import { TIERS, type Tier } from '../../src/commerce/tiers';
import { tierRow } from '../../src/pricing/book';
import { IN_PRICE_BOOK } from '../../src/pricing/india';
import type { BillingCycle } from '../../src/rails/pack';

const plan = (tier: Tier, cycle: BillingCycle) => ({ tier, cycle });

describe('planChangeKindOf — what a live paid plan becomes', () => {
  it.each([
    ['growth', 'monthly', 'pro', 'monthly', 'upgrade'],
    ['starter', 'monthly', 'growth', 'yearly', 'upgrade'],
    ['growth', 'monthly', 'starter', 'monthly', 'downgrade'],
    ['pro', 'yearly', 'growth', 'monthly', 'downgrade'],
    ['growth', 'monthly', 'growth', 'yearly', 'cycle_switch'],
    ['growth', 'yearly', 'growth', 'monthly', 'cycle_switch'],
    ['growth', 'monthly', 'growth', 'monthly', null],
  ] as const)('%s %s → %s %s is %s', (fromTier, fromCycle, toTier, toCycle, kind) => {
    expect(planChangeKindOf(plan(fromTier, fromCycle), plan(toTier, toCycle))).toBe(kind);
  });
});

describe('tierStepOf — the ladder is the order of capacity (BM-11, BM-12)', () => {
  it.each([
    ['starter', 'growth', 'higher'],
    ['pro', 'growth', 'lower'],
    ['growth', 'growth', 'same'],
  ] as const)('%s → %s is %s', (from, to, step) => {
    expect(tierStepOf(from, to)).toBe(step);
  });

  it('holds against the India book: each self-serve rung takes nothing from the one below', () => {
    const sold: readonly Tier[] = TIERS.filter((tier) => tier !== 'enterprise');
    sold.slice(1).forEach((higher, i) => {
      const below = tierRow(IN_PRICE_BOOK, sold[i] as Tier);
      const above = tierRow(IN_PRICE_BOOK, higher);
      if (below === null || above === null)
        throw new Error('the India book sells every self-serve rung');
      expect(appliesImmediately(below.capacity, above.capacity)).toBe(true);
    });
  });
});

describe('activeProjectsBlock — a downgrade below the projects already live (M08-07, M12-49)', () => {
  it.each([
    { live: 10, limit: 10, block: null },
    { live: 11, limit: 10, block: { used: 11, limit: 10 } },
    { live: 0, limit: 0, block: null },
    { live: 1, limit: 0, block: { used: 1, limit: 0 } },
    { live: 500, limit: 'unlimited', block: null },
    { live: 500, limit: 'custom', block: null },
  ] as const)('$live live against $limit → $block', ({ live, limit, block }) => {
    expect(activeProjectsBlock(live, limit)).toEqual(block);
  });
});
