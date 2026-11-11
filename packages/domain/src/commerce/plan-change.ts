import type { BillingCycle } from '../rails/pack';
import { TIERS, type Tier, type TierLimit } from './tiers';

/**
 * What a pick on the plan screen is (`M12-48`, `M12-49`, `M12-12`, `M12-54`): a live paid row's
 * upgrade, downgrade or cycle switch, or a trial's or a dead row's conversion, which checkout
 * runs. Values append in the order the enum grew.
 */
export const PLAN_CHANGE_KINDS = ['upgrade', 'downgrade', 'cycle_switch', 'conversion'] as const;
export type PlanChangeKind = (typeof PLAN_CHANGE_KINDS)[number];

/** The two kinds that wait for the paid period's end and can be scheduled. */
export const SCHEDULED_PLAN_CHANGES = ['downgrade', 'cycle_switch'] as const;
export type ScheduledPlanChange = (typeof SCHEDULED_PLAN_CHANGES)[number];

/**
 * A scheduled change's life: `scheduled` until the paid period ends, then `applied`; `withdrawn`
 * when the Owner keeps the plan; `replaced` when a later pick took its place. The pgEnum
 * `plan_change_status` mirrors it.
 */
export const PLAN_CHANGE_STATUSES = ['scheduled', 'applied', 'withdrawn', 'replaced'] as const;
export type PlanChangeStatus = (typeof PLAN_CHANGE_STATUSES)[number];

/**
 * What a downgrade's preview counts against the lower plan (`M12-49`). It grows with the module
 * that lands each table (Law 9): designs over the kW ceiling with the studio, proposals this cycle
 * with proposals, active projects with projects. Values append in the order the enum grew.
 */
export const PLAN_CHANGE_BLOCKS = ['storage', 'active_projects'] as const;
export type PlanChangeBlock = (typeof PLAN_CHANGE_BLOCKS)[number];

/**
 * The lower plan's block on live projects (`M08-07`): more live than it lets a company hold. The
 * projects already live keep working whatever the plan; the block only says the downgrade would
 * stop a new one. `null` when the plan holds them all.
 */
export function activeProjectsBlock(
  live: number,
  limit: TierLimit,
): { readonly used: number; readonly limit: number } | null {
  return typeof limit === 'number' && live > limit ? { used: live, limit } : null;
}

/** What a hosted checkout page is for: a conversion or reactivation, or an upgrade's charge. */
export const CHECKOUT_PURPOSES = ['conversion', 'plan_change'] as const;
export type CheckoutPurpose = (typeof CHECKOUT_PURPOSES)[number];

export interface HeldPlan {
  readonly tier: Tier;
  readonly cycle: BillingCycle;
}

/**
 * Where one tier stands against another on the ladder (`BM-11`): the four tiers are one ascending
 * ladder in every market's book, each rung holding at least the one below (`BM-12`), so the order
 * of `TIERS` is the order of capacity.
 */
export function tierStepOf(from: Tier, to: Tier): 'higher' | 'lower' | 'same' {
  const step = TIERS.indexOf(to) - TIERS.indexOf(from);
  if (step === 0) return 'same';
  return step > 0 ? 'higher' : 'lower';
}

/**
 * A live paid plan's change to another: the same tier on another cycle is a cycle switch; a higher
 * rung is an upgrade, a lower one a downgrade (`tierStepOf`). `null` for the plan already held —
 * there is nothing to change.
 */
export function planChangeKindOf(
  held: HeldPlan,
  picked: HeldPlan,
): Exclude<PlanChangeKind, 'conversion'> | null {
  const step = tierStepOf(held.tier, picked.tier);
  if (step === 'same') return held.cycle === picked.cycle ? null : 'cycle_switch';
  return step === 'higher' ? 'upgrade' : 'downgrade';
}
