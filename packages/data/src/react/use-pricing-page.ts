'use client';
import type { PublicPricingRead } from '@heliogrid/contracts';
import {
  againstOptionsOf,
  type BillingCycle,
  planPairOf,
  type ScaledPower,
  scaledPower,
  type Tier,
} from '@heliogrid/domain';
import { useState } from 'react';
import { usePricing } from './use-pricing';

/** A design ceiling as the page prints it: a power in its unit, no ceiling, or negotiated. */
export type DesignPower = ScaledPower | 'unlimited' | 'custom';

/** The three sets the comparison shows (`SCR-M12-03`'s set words). */
export const PRICING_SETS = ['limits', 'included', 'charges'] as const;
export type PricingSet = (typeof PRICING_SETS)[number];

type WirePlan = PublicPricingRead['plans'][number];
export interface PricingPlan extends WirePlan {
  readonly designPower: DesignPower;
}
export interface PricingComparison {
  readonly tier: Tier;
  readonly competitor: string;
  readonly rung: string;
  readonly power: ScaledPower;
  readonly ours: string;
  readonly theirs: string;
}
export interface PricingView extends Omit<PublicPricingRead, 'plans' | 'comparisons'> {
  readonly plans: readonly PricingPlan[];
  readonly comparisons: readonly PricingComparison[];
  readonly trialDesignPower: DesignPower;
}

function designPowerOf(limit: WirePlan['designCeilingKw']): DesignPower {
  return typeof limit === 'number' ? scaledPower(limit) : limit;
}

function viewOf(pricing: PublicPricingRead): PricingView {
  return {
    ...pricing,
    plans: pricing.plans.map((plan) => ({
      ...plan,
      designPower: designPowerOf(plan.designCeilingKw),
    })),
    comparisons: pricing.comparisons.map((row) => ({
      tier: row.tier,
      competitor: row.competitor,
      rung: row.rung,
      power: scaledPower(row.designCeilingKw),
      ours: row.ours,
      theirs: row.theirs,
    })),
    trialDesignPower: designPowerOf(pricing.trial.designCeilingKw),
  };
}

/**
 * The public pricing page (`SCR-M12-01`): the price list read and every choice the page holds —
 * the cycle, the one plan whose limits stand open, the rows that open in place, and the two plans
 * a phone compares. Nothing here is sent anywhere; every choice only changes what is drawn.
 */
export function usePricingPage(marketCode: string) {
  const read = usePricing(marketCode);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openPlan, setOpenPlan] = useState<Tier | null>(null);
  const [includesOpen, setIncludesOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);
  const [chosen, setChosen] = useState<{ plan: Tier; against: Tier }>({
    plan: 'growth',
    against: 'pro',
  });
  const [set, setSet] = useState<PricingSet>('limits');

  const view = read.kind === 'ready' && read.value !== null ? viewOf(read.value) : null;
  const sold = view?.plans.map((plan) => plan.tier) ?? [];
  const pair = planPairOf(sold, chosen.plan, chosen.against);

  return {
    read,
    view,
    cycle,
    chooseCycle: setCycle,
    openPlan,
    togglePlan: (tier: Tier) => setOpenPlan((open) => (open === tier ? null : tier)),
    includesOpen,
    toggleIncludes: () => setIncludesOpen((open) => !open),
    compareOpen,
    toggleCompare: () => setCompareOpen((open) => !open),
    trialOpen,
    toggleTrial: () => setTrialOpen((open) => !open),
    pair,
    planOptions: sold,
    againstOptions: pair === null ? [] : againstOptionsOf(sold, pair.plan),
    choosePlan: (plan: Tier) => setChosen((was) => planPairOf(sold, plan, was.against) ?? was),
    chooseAgainst: (against: Tier) =>
      setChosen((was) => ({ plan: pair?.plan ?? was.plan, against })),
    set,
    chooseSet: setSet,
  };
}
