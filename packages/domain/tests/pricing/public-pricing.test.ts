import { describe, expect, it } from 'vitest';
import { bookEntitlements, type Entitlement } from '../../src/commerce/entitlements';
import { TIERS, type Tier, type TierLimit } from '../../src/commerce/tiers';
import { IN_PACK, type MarketPack } from '../../src/market/pack';
import { minorUnits } from '../../src/money/minor-units';
import type { PriceBookPack } from '../../src/pricing/pack';
import { publicPricing } from '../../src/pricing/public-pricing';

function withBook(change: Partial<PriceBookPack>): MarketPack {
  return { ...IN_PACK, priceBook: { ...IN_PACK.priceBook, ...change } };
}

function pricingOf(pack: MarketPack = IN_PACK) {
  const pricing = publicPricing(pack);
  if (pricing === null) throw new Error('the India book sells no plan');
  return pricing;
}

function limitIn(entitlements: readonly Entitlement[], key: Entitlement['key']): TierLimit {
  const found = entitlements.find((entitlement) => entitlement.key === key);
  if (found === undefined) throw new Error(`no ${key}`);
  return found.limit;
}

const CAPACITY_FIELDS = [
  'activeProjects',
  'designCeilingKw',
  'price',
  'proposalsPerMonth',
  'storageGb',
  'tier',
  'voiceMinuteRate',
  'voiceMinutesIncluded',
];

describe('publicPricing — what a public page may print of the book (SCR-M12-01)', () => {
  it('every tier lists every module and differs only in ceilings, counts and bundles (BM-05)', () => {
    const { plans } = pricingOf();
    expect(plans.map((plan) => plan.tier)).toEqual([...TIERS]);
    for (const plan of plans) expect(Object.keys(plan).sort()).toEqual(CAPACITY_FIELDS);
  });

  it.each(TIERS.map((tier) => ({ tier })))(
    'every published cap is the cap the entitlement gate holds, the trial’s ceiling too (BM-07) — $tier',
    ({ tier }) => {
      const pricing = pricingOf();
      const plan = pricing.plans.find((candidate) => candidate.tier === tier);
      const gate = bookEntitlements(IN_PACK.priceBook, tier);
      expect(plan?.designCeilingKw).toBe(limitIn(gate, 'design_ceiling_kw'));
      expect(plan?.proposalsPerMonth).toBe(limitIn(gate, 'proposals_per_cycle'));
      expect(plan?.activeProjects).toBe(limitIn(gate, 'active_projects'));
      expect(plan?.voiceMinutesIncluded).toBe(limitIn(gate, 'voice_minutes'));
      expect(plan?.storageGb).toBe(limitIn(gate, 'storage_gb'));
      const trialGate = bookEntitlements(IN_PACK.priceBook, null);
      expect(pricing.trial.designCeilingKw).toBe(limitIn(trialGate, 'design_ceiling_kw'));
      expect(pricing.trial.designCeilingKw).toBe(100_000);
      expect(pricing.trial.voiceMinutes).toBe(limitIn(trialGate, 'voice_minutes'));
      expect(pricing.trial.storageGb).toBe(limitIn(trialGate, 'storage_gb'));
    },
  );

  it('carries no service terms: support is copy keyed by tier (BM-14)', () => {
    const text = JSON.stringify(pricingOf());
    expect(text).not.toMatch(/support|whatsapp|onboarding|named contact/i);
  });

  it('prints no worst-case cost and no V2 add-on (BM-26, BM-41)', () => {
    const text = JSON.stringify(pricingOf());
    expect(text).not.toMatch(/cogs|worstCase|marketing|seat/i);
  });

  it.each([
    { name: 'a published rate', draft: false, want: { kind: 'published', rate: 600 } },
    { name: 'a draft rate', draft: true, want: { kind: 'unpublished' } },
  ])('names $name as itself, never a draft figure (BM-26)', ({ draft, want }) => {
    const voice = { ...IN_PACK.priceBook.overage.voice_minutes, draft } as const;
    const pricing = pricingOf(
      withBook({ overage: { ...IN_PACK.priceBook.overage, voice_minutes: voice } }),
    );
    expect(pricing.plans.find((plan) => plan.tier === 'growth')?.voiceMinuteRate).toEqual(want);
    expect(pricing.plans.find((plan) => plan.tier === 'enterprise')?.voiceMinuteRate).toEqual({
      kind: 'custom',
    });
  });

  it.each([
    { sold: 'every tier', drop: [] as Tier[], plans: 4 },
    { sold: 'one tier', drop: ['growth', 'pro', 'enterprise'] as Tier[], plans: 1 },
  ])('lists only the plans the market sells — $sold (BM-11)', ({ drop, plans }) => {
    const tiers = { ...IN_PACK.priceBook.tiers };
    for (const tier of drop) tiers[tier] = null;
    expect(pricingOf(withBook({ tiers })).plans).toHaveLength(plans);
  });

  it('has nothing to print for a market that sells no plan (BM-37)', () => {
    const tiers = { starter: null, growth: null, pro: null, enterprise: null };
    expect(publicPricing(withBook({ tiers }))).toBeNull();
  });

  it('keeps Enterprise’s anchor as an anchor, quoted monthly (BM-15)', () => {
    const enterprise = pricingOf().plans.find((plan) => plan.tier === 'enterprise');
    expect(enterprise?.price).toEqual({ kind: 'anchored', from: 2_499_900, per: 'monthly' });
  });
});

describe('publicPricing — Compared with (BM-39)', () => {
  it('pairs each benchmark rung with the plan at the same design ceiling, both yearly', () => {
    const { comparisons, benchmarkSources } = pricingOf();
    expect(
      comparisons.map(({ tier, rung, ours, theirs }) => ({ tier, rung, ours, theirs })),
    ).toEqual([
      { tier: 'starter', rung: 'Basic', ours: 1_999_000, theirs: 6_000_000 },
      { tier: 'growth', rung: 'Pro', ours: 3_999_000, theirs: 8_500_000 },
      { tier: 'pro', rung: 'Premium', ours: 9_999_900, theirs: 12_000_000 },
    ]);
    expect(benchmarkSources.map((source) => source.competitor)).toEqual(['Reslink India']);
  });

  it.each([
    { name: 'a rung no plan matches', designCeilingKw: 75, cycle: 'yearly' as const, rows: 0 },
    { name: 'a rung a plan matches', designCeilingKw: 50, cycle: 'yearly' as const, rows: 1 },
    {
      name: 'a monthly rung a plan matches',
      designCeilingKw: 50,
      cycle: 'monthly' as const,
      rows: 0,
    },
  ])('draws $name only when a plan meets it, yearly', ({ designCeilingKw, cycle, rows }) => {
    const benchmarks = [
      {
        competitor: 'Sample',
        source: 'sample page',
        readOn: '2026-01-01',
        rungs: [
          {
            label: 'One',
            price: minorUnits(100),
            cycle,
            designCeilingKw,
            proposalsPerCycle: null,
          },
        ],
      },
    ];
    const pricing = pricingOf(withBook({ benchmarks }));
    expect(pricing.comparisons).toHaveLength(rows);
    expect(pricing.benchmarkSources).toHaveLength(rows);
  });
});

describe('publicPricing — the tax line and the sales act', () => {
  it.each([
    { name: 'not registered', registration: null, excluded: false },
    {
      name: 'registered',
      registration: { type: 'IN_GST', number: '27AAAAA0000A1Z5' },
      excluded: true,
    },
  ])(
    'says prices exclude the tax only when the platform is $name (F1-29)',
    ({ registration, excluded }) => {
      const pack = {
        ...IN_PACK,
        tax: { ...IN_PACK.tax, platformRegistration: registration },
      } as MarketPack;
      expect(pricingOf(pack).taxExcluded).toBe(excluded);
      expect(pricingOf(pack).taxScheme).toBe('GST');
    },
  );

  it.each([
    {
      name: 'a book with a sales address',
      contact: 'sales@example.com',
      want: 'sales@example.com',
    },
    { name: 'a book with none', contact: undefined, want: null },
  ])('offers sales from $name (BM-15)', ({ contact, want }) => {
    expect(pricingOf(withBook({ salesContact: contact })).salesContact).toBe(want);
  });
});
