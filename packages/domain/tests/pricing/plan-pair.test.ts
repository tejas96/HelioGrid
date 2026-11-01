import { describe, expect, it } from 'vitest';
import { TIERS, type Tier } from '../../src/commerce/tiers';
import { againstOptionsOf, planPairOf } from '../../src/pricing/plan-pair';

describe('planPairOf — two different plans, always (SCR-M12-01)', () => {
  it.each([
    {
      name: 'two different plans stay',
      plan: 'growth',
      against: 'pro',
      want: { plan: 'growth', against: 'pro' },
    },
    {
      name: 'the same plan moves Against on',
      plan: 'pro',
      against: 'pro',
      want: { plan: 'pro', against: 'enterprise' },
    },
    {
      name: 'the last plan wraps Against to the first',
      plan: 'enterprise',
      against: 'enterprise',
      want: { plan: 'enterprise', against: 'starter' },
    },
  ] as const)('$name', ({ plan, against, want }) => {
    expect(planPairOf(TIERS, plan, against)).toEqual(want);
  });

  it.each([
    {
      name: 'a plan not sold falls to the first sold',
      sold: ['growth', 'pro'] as Tier[],
      plan: 'starter' as Tier,
      against: 'pro' as Tier,
      want: { plan: 'growth', against: 'pro' },
    },
    {
      name: 'an Against not sold moves on',
      sold: ['growth', 'pro'] as Tier[],
      plan: 'growth' as Tier,
      against: 'starter' as Tier,
      want: { plan: 'growth', against: 'pro' },
    },
    {
      name: 'one plan sold has no pair',
      sold: ['growth'] as Tier[],
      plan: 'growth' as Tier,
      against: 'pro' as Tier,
      want: null,
    },
    {
      name: 'no plan sold has no pair',
      sold: [] as Tier[],
      plan: 'growth' as Tier,
      against: 'pro' as Tier,
      want: null,
    },
  ])('$name', ({ sold, plan, against, want }) => {
    expect(planPairOf(sold, plan, against)).toEqual(want);
  });

  it('Against never offers the plan chosen in Plan', () => {
    expect(againstOptionsOf(TIERS, 'growth')).toEqual(['starter', 'pro', 'enterprise']);
  });
});
