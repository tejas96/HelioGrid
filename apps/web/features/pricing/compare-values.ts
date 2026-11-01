import type { PricingPlan, PricingSet } from '@heliogrid/data/react';
import { PRICING, planName } from '@heliogrid/i18n';
import type { CompareAttribute, CompareOption } from '@heliogrid/ui';
import type { PlanWords, Translate } from './plan-words';

/**
 * The comparison's rows for one set — `SCR-M12-03`'s set words, `Limits` · `Included` ·
 * `Extra charges`. The table carries the period with the value (`SCR-M12-01` decision 7).
 */
export function compareAttributes(set: PricingSet, t: Translate): CompareAttribute[] {
  if (set === 'included') {
    return [
      { key: 'voice', label: t(PRICING.voiceMinutes) },
      { key: 'storage', label: t(PRICING.storage) },
    ];
  }
  if (set === 'charges') {
    return [
      {
        key: 'voiceRate',
        label: t(PRICING.voiceMinutes),
        numeric: true,
        gapLabel: t(PRICING.notPublished),
      },
    ];
  }
  return [
    { key: 'design', label: t(PRICING.biggestDesign) },
    { key: 'proposals', label: t(PRICING.proposals) },
    { key: 'projects', label: t(PRICING.activeProjects) },
    { key: 'users', label: t(PRICING.users) },
  ];
}

function perMonth(value: string, counted: boolean, t: Translate): string {
  return counted ? t(PRICING.perMonth, { value }) : value;
}

export function compareOption(
  plan: PricingPlan,
  set: PricingSet,
  t: Translate,
  words: PlanWords,
): CompareOption {
  const values: Record<string, string | undefined> =
    set === 'included'
      ? {
          voice: perMonth(
            words.voiceIncluded(plan.voiceMinutesIncluded),
            typeof plan.voiceMinutesIncluded === 'number' && plan.voiceMinutesIncluded > 0,
            t,
          ),
          storage: words.storage(plan.storageGb),
        }
      : set === 'charges'
        ? { voiceRate: words.voiceRate(plan) ?? undefined }
        : {
            design: words.power(plan.designPower),
            proposals: perMonth(
              words.limit(plan.proposalsPerMonth),
              typeof plan.proposalsPerMonth === 'number',
              t,
            ),
            projects: words.limit(plan.activeProjects),
            users: t(PRICING.unlimited),
          };
  return { key: plan.tier, name: planName(plan.tier), values };
}
