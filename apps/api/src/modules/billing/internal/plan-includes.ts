import type { BillingHome } from '@heliogrid/contracts';
import { type MarketPack, publicPricing, type Tier, trialCapacity } from '@heliogrid/domain';
import { decimalOf } from './billing-sale';

/**
 * A plan's published limits as the pricing page prints them, or the trial's caps for `null` or a
 * tier the book does not print (`M12-55`, `M12-52`).
 */
export function planIncludesOf(pack: MarketPack, tier: Tier | null): BillingHome['includes'] {
  const plan =
    tier === null ? undefined : publicPricing(pack)?.plans.find((each) => each.tier === tier);
  if (plan !== undefined) {
    return {
      designCeilingKw: plan.designCeilingKw,
      proposalsPerMonth: plan.proposalsPerMonth,
      activeProjects: plan.activeProjects,
      voiceMinutesIncluded: plan.voiceMinutesIncluded,
      voiceMinuteRate:
        plan.voiceMinuteRate.kind === 'published'
          ? decimalOf(pack, plan.voiceMinuteRate.rate)
          : null,
      storageGb: plan.storageGb,
    };
  }
  const trial = trialCapacity(pack.priceBook);
  return {
    designCeilingKw: trial.designCeilingKw,
    proposalsPerMonth: trial.creationsPerCycle.proposals,
    activeProjects: trial.creationsPerCycle.active_projects,
    voiceMinutesIncluded: trial.meterBundles.voice_minutes,
    // A trial pays nothing, so no rate stands beside its cap (`M12-52`).
    voiceMinuteRate: null,
    storageGb: trial.storageGb,
  };
}
