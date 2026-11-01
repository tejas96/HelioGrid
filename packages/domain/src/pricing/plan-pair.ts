import type { Tier } from '../commerce/tiers';

/**
 * The two plans a phone compares (`SCR-M12-01`, decision 11): `Against` never offers the plan
 * chosen in `Plan`. Choosing in `Plan` the plan `Against` holds moves `Against` to the next sold
 * plan, wrapping, so the pair is always two different plans. `null` when fewer than two are sold.
 */
export interface PlanPair {
  readonly plan: Tier;
  readonly against: Tier;
}

export function planPairOf(sold: readonly Tier[], plan: Tier, against: Tier): PlanPair | null {
  if (sold.length < 2) return null;
  const chosen = sold.includes(plan) ? plan : (sold[0] as Tier);
  if (against !== chosen && sold.includes(against)) return { plan: chosen, against };
  const next = sold[(sold.indexOf(chosen) + 1) % sold.length] as Tier;
  return { plan: chosen, against: next };
}

/** What `Against` offers: every sold plan but the one in `Plan`. */
export function againstOptionsOf(sold: readonly Tier[], plan: Tier): Tier[] {
  return sold.filter((tier) => tier !== plan);
}
