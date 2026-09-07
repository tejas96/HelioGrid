import { describe, expect, it } from 'vitest';
import { METERS } from '../../src/commerce/meters';
import { TIERS, type Tier } from '../../src/commerce/tiers';
import { IN_PACK } from '../../src/market/pack';
import type { MinorUnits } from '../../src/money/minor-units';
import {
  isSellable,
  listedPrice,
  tenMonthYearly,
  tierRow,
  trialCapacity,
} from '../../src/pricing/book';
import { IN_PRICE_BOOK } from '../../src/pricing/india';
import type { BillingCycle } from '../../src/rails/pack';

/** The rung's listed price. A `null` here is an authoring error in the book, never a case. */
function priced(tier: Tier, cycle: BillingCycle): MinorUnits {
  const price = listedPrice(IN_PRICE_BOOK, tier, cycle);
  if (price === null) throw new Error(`${tier} has no listed ${cycle} price`);
  return price;
}

describe('listedPrice — what a rung costs, or nothing to render (BM-11, BM-15)', () => {
  it.each([
    { tier: 'starter', monthly: 199_900, yearly: 1_999_000 },
    { tier: 'growth', monthly: 399_900, yearly: 3_999_000 },
    { tier: 'pro', monthly: 999_900, yearly: 9_999_900 },
  ] as const)(
    'prices $tier from the book and nowhere else (F1-60)',
    ({ tier, monthly, yearly }) => {
      expect(listedPrice(IN_PRICE_BOOK, tier, 'monthly')).toBe(monthly);
      expect(listedPrice(IN_PRICE_BOOK, tier, 'yearly')).toBe(yearly);
    },
  );

  it('renders no price for a sales-assisted rung — an anchor is not a price (BM-15)', () => {
    expect(listedPrice(IN_PRICE_BOOK, 'enterprise', 'monthly')).toBeNull();
    expect(tierRow(IN_PRICE_BOOK, 'enterprise')?.price).toEqual({
      kind: 'anchored',
      from: 2_499_900,
      per: 'monthly',
      contract: 'yearly',
    });
  });

  it('renders nothing at all for a rung a market does not sell (BM-11)', () => {
    const noGrowth = { ...IN_PRICE_BOOK, tiers: { ...IN_PRICE_BOOK.tiers, growth: null } };
    expect(tierRow(noGrowth, 'growth')).toBeNull();
    expect(listedPrice(noGrowth, 'growth', 'yearly')).toBeNull();
  });
});

describe('the yearly cycle is sized at pay-ten-get-twelve, and the book row wins (BM-13, BM-41)', () => {
  it.each(['starter', 'growth'] as const)('lands %s exactly on the ten-month sizing', (tier) => {
    expect(priced(tier, 'yearly')).toBe(tenMonthYearly(priced(tier, 'monthly')));
  });

  it('carries the source’s ₹9 deviation on Pro as-is — the formula sizes, the row prices', () => {
    const sized = tenMonthYearly(priced('pro', 'monthly'));
    expect(sized).toBe(9_999_000);
    expect(priced('pro', 'yearly')).toBe(9_999_900);
    expect(priced('pro', 'yearly') - sized).toBe(900);
  });
});

describe('isSellable — a draft rate is never launch-final (BM-26, Q1/Q17)', () => {
  it.each(['voice_minutes', 'ai_roof_detections'] as const)(
    'sells %s: its rate is verified',
    (meter) => {
      expect(isSellable(IN_PRICE_BOOK, meter)).toBe(true);
    },
  );

  it.each(['marketing_sends', 'tracked_field_seats'] as const)(
    'refuses %s: draft pending the rate card',
    (meter) => {
      expect(isSellable(IN_PRICE_BOOK, meter)).toBe(false);
    },
  );

  it('sells storage, which has no rate to be draft — a ceiling never overruns (BM-20)', () => {
    expect(IN_PRICE_BOOK.overage.storage).toEqual({ kind: 'ceiling' });
    expect(isSellable(IN_PRICE_BOOK, 'storage')).toBe(true);
  });

  it('answers for every meter in the closed set — no meter is unpriced (BM-16, BM-17)', () => {
    for (const meter of METERS) {
      expect(typeof isSellable(IN_PRICE_BOOK, meter)).toBe('boolean');
    }
  });
});

describe('the benchmark law — under the incumbents at equivalent capacity, always (BM-39)', () => {
  const reslink = IN_PRICE_BOOK.benchmarks.find((b) => b.competitor === 'Reslink India');

  it.each(reslink?.rungs ?? [])('prices under Reslink $label at $designCeilingKw kW', (rung) => {
    const ours = TIERS.filter(
      (tier) => tierRow(IN_PRICE_BOOK, tier)?.capacity.designCeilingKw === rung.designCeilingKw,
    );
    expect(ours).toHaveLength(1);
    const [rungWeMatch] = ours;
    if (rungWeMatch === undefined) throw new Error(`no tier serves ${rung.designCeilingKw} kW`);
    expect(priced(rungWeMatch, rung.cycle)).toBeLessThan(rung.price);
  });

  it('beats the benchmark’s published proposal count where it publishes one (BM-41)', () => {
    const pro = reslink?.rungs.find((rung) => rung.proposalsPerCycle !== null);
    expect(pro?.proposalsPerCycle).toBe(1_000);
    expect(tierRow(IN_PRICE_BOOK, 'pro')?.capacity.creationsPerCycle.proposals).toBe(1_500);
  });

  it('records a competitor that publishes no rungs, rather than omitting it (BM-39)', () => {
    const arka = IN_PRICE_BOOK.benchmarks.find((b) => b.competitor === 'ARKA');
    expect(arka?.rungs).toEqual([]);
    expect(arka?.source).not.toBe('');
  });

  it('carries provenance on every benchmark — an undated figure cannot go stale (BM-39)', () => {
    for (const benchmark of IN_PRICE_BOOK.benchmarks) {
      expect(benchmark.readOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(benchmark.source).not.toBe('');
    }
  });
});

describe('the book is the pack’s price-book key (F1-02, F1-25)', () => {
  it('is reached through the pack, never as a module constant', () => {
    expect(IN_PACK.priceBook).toBe(IN_PRICE_BOOK);
  });

  it('caps the trial only on what costs real money (BM-28)', () => {
    expect(IN_PRICE_BOOK.trialCaps.meterBundles.ai_roof_detections).toBe(25);
    expect(IN_PRICE_BOOK.trialCaps.meterBundles.voice_minutes).toBe(15);
    expect(IN_PRICE_BOOK.trialCaps.storageGb).toBe(5);
  });
});

describe('trialCapacity — the whole product, bounded only by the book (BM-28, BM-31)', () => {
  it('withholds no capability: no design ceiling and no creation count', () => {
    const trial = trialCapacity(IN_PRICE_BOOK);
    expect(trial.designCeilingKw).toBe('unlimited');
    expect(trial.creationsPerCycle).toEqual({
      proposals: 'unlimited',
      active_projects: 'unlimited',
    });
  });

  it('is bounded by the book’s caps and by nothing else (BM-41)', () => {
    const trial = trialCapacity(IN_PRICE_BOOK);
    expect(trial.meterBundles).toEqual({
      voice_minutes: 15,
      ai_roof_detections: 25,
      marketing_sends: 0,
      tracked_field_seats: 0,
    });
    expect(trial.storageGb).toBe(5);
  });

  it('outreaches every tier it is meant to let a buyer evaluate (BM-28)', () => {
    expect(trialCapacity(IN_PRICE_BOOK).designCeilingKw).not.toBe(
      tierRow(IN_PRICE_BOOK, 'enterprise')?.capacity.designCeilingKw,
    );
  });

  it('re-reads the book rather than carrying a cap of its own', () => {
    const generousBook = {
      ...IN_PRICE_BOOK,
      trialCaps: { ...IN_PRICE_BOOK.trialCaps, storageGb: 500 },
    };
    expect(trialCapacity(generousBook).storageGb).toBe(500);
  });
});
