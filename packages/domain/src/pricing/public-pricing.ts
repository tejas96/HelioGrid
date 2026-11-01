import type { Meter } from '../commerce/meters';
import { TIERS, type Tier, type TierLimit } from '../commerce/tiers';
import { TRIAL_DAYS } from '../commerce/trial';
import type { MarketPack } from '../market/pack';
import type { MinorUnits } from '../money/minor-units';
import type { BillingCycle } from '../rails/pack';
import { trialCapacity } from './book';
import type { PriceBookPack, TierBookRow } from './pack';

/**
 * What a public pricing page may print of a market's book (`BM-05`, `BM-07`, `SCR-M12-01`), and
 * nothing more: no worst-case cost, no draft rate's figure, no V2 add-on. It reads figures out of
 * the pack and computes none, so it stays on the index.
 *
 * A plan carries capacity only. No field names a module or a feature, because every module is in
 * every plan (`BM-05`) — a feature field here would be the first ransom.
 */

export type PublicPrice =
  | { readonly kind: 'listed'; readonly perCycle: Record<BillingCycle, MinorUnits> }
  | { readonly kind: 'anchored'; readonly from: MinorUnits; readonly per: BillingCycle };

/** A rate the book marks draft is a named gap on a public page, never its number (`BM-26`). */
export type PublicRate =
  | { readonly kind: 'published'; readonly rate: MinorUnits }
  | { readonly kind: 'unpublished' }
  | { readonly kind: 'custom' };

export interface PublicPlan {
  readonly tier: Tier;
  readonly price: PublicPrice;
  readonly designCeilingKw: TierLimit;
  readonly proposalsPerMonth: TierLimit;
  readonly activeProjects: TierLimit;
  readonly voiceMinutesIncluded: TierLimit;
  readonly voiceMinuteRate: PublicRate;
  readonly storageGb: TierLimit;
}

export interface PublicTrial {
  readonly days: number;
  readonly designCeilingKw: TierLimit;
  readonly proposalsPerMonth: TierLimit;
  readonly voiceMinutes: TierLimit;
  readonly storageGb: TierLimit;
}

/** One rung of `Compared with`: our plan beside a competitor's at the same design ceiling. */
export interface PublicComparison {
  readonly tier: Tier;
  readonly designCeilingKw: number;
  readonly cycle: BillingCycle;
  readonly ours: MinorUnits;
  readonly competitor: string;
  readonly rung: string;
  readonly theirs: MinorUnits;
}

export interface PublicBenchmarkSource {
  readonly competitor: string;
  readonly source: string;
  readonly readOn: string;
}

export interface PublicPricing {
  readonly plans: readonly PublicPlan[];
  readonly trial: PublicTrial;
  readonly comparisons: readonly PublicComparison[];
  readonly benchmarkSources: readonly PublicBenchmarkSource[];
  /** The scheme's name (`GST`) and whether prices are said to exclude it: only once registered (`F1-29`). */
  readonly taxScheme: string;
  readonly taxExcluded: boolean;
  readonly salesContact: string | null;
}

/** The public view of this market's book, or `null` when it sells no plan (`BM-37`). */
export function publicPricing(pack: MarketPack): PublicPricing | null {
  const book = pack.priceBook;
  const plans = TIERS.flatMap((tier) => {
    const row = book.tiers[tier];
    return row === null ? [] : [publicPlan(book, tier, row)];
  });
  if (plans.length === 0) return null;
  const comparisons = comparisonsOf(plans, book);
  return {
    plans,
    trial: publicTrial(book),
    comparisons,
    benchmarkSources: book.benchmarks
      .filter((benchmark) => comparisons.some((row) => row.competitor === benchmark.competitor))
      .map(({ competitor, source, readOn }) => ({ competitor, source, readOn })),
    taxScheme: pack.tax.scheme,
    taxExcluded: pack.tax.platformRegistration !== null,
    salesContact: book.salesContact ?? null,
  };
}

function publicPlan(book: PriceBookPack, tier: Tier, row: TierBookRow): PublicPlan {
  const { capacity } = row;
  const voiceIncluded = capacity.meterBundles.voice_minutes;
  return {
    tier,
    price:
      row.price.kind === 'listed'
        ? { kind: 'listed', perCycle: row.price.perCycle }
        : { kind: 'anchored', from: row.price.from, per: row.price.per },
    designCeilingKw: capacity.designCeilingKw,
    proposalsPerMonth: capacity.creationsPerCycle.proposals,
    activeProjects: capacity.creationsPerCycle.active_projects,
    voiceMinutesIncluded: voiceIncluded,
    voiceMinuteRate:
      voiceIncluded === 'custom' ? { kind: 'custom' } : rateOf(book, 'voice_minutes'),
    storageGb: capacity.storageGb,
  };
}

function rateOf(book: PriceBookPack, meter: Meter): PublicRate {
  const overage = book.overage[meter];
  if (overage.kind !== 'per_unit' || overage.draft) return { kind: 'unpublished' };
  return { kind: 'published', rate: overage.rate };
}

function publicTrial(book: PriceBookPack): PublicTrial {
  const trial = trialCapacity(book);
  return {
    days: TRIAL_DAYS,
    designCeilingKw: trial.designCeilingKw,
    proposalsPerMonth: trial.creationsPerCycle.proposals,
    voiceMinutes: trial.meterBundles.voice_minutes,
    storageGb: trial.storageGb,
  };
}

/**
 * `BM-39` — a yearly rung pairs with the plan whose ceiling is the rung's, both yearly; a rung with
 * no such plan, or quoted per month, is not drawn — the page prints every pair as a year's price.
 */
function comparisonsOf(plans: readonly PublicPlan[], book: PriceBookPack): PublicComparison[] {
  return book.benchmarks.flatMap((benchmark) =>
    benchmark.rungs.flatMap((rung) => {
      const plan = plans.find((candidate) => candidate.designCeilingKw === rung.designCeilingKw);
      if (plan === undefined || plan.price.kind !== 'listed' || rung.cycle !== 'yearly') return [];
      return [
        {
          tier: plan.tier,
          designCeilingKw: rung.designCeilingKw,
          cycle: 'yearly',
          ours: plan.price.perCycle[rung.cycle],
          competitor: benchmark.competitor,
          rung: rung.label,
          theirs: rung.price,
        },
      ];
    }),
  );
}
