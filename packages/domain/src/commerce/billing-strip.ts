import { can } from '../authz/policy';
import type { RolePreset } from '../authz/roles';
import { MS_PER_DAY } from '../format/zone';
import { FINAL_WARNING_DAY } from './billing-notices';
import type { BillingPhase } from './soft-block';
import { CAP_HELD_STEPS, type CapHeldStep, type UsageStepName } from './usage-steps';

/**
 * `M12-53` — from this many days before a trial ends, its countdown stops being a quiet chip and
 * becomes the strip with its act. A separate fact from `TRIAL_NUDGE_LEAD_DAYS`, the first trial
 * notice, which happens to be the same day: either could move without the other.
 */
export const TRIAL_CHIP_PROMINENT_DAYS = 7;

/**
 * Where the strip's and the denial's one act goes (decision 5): Billing Home, the failed charge's
 * own pay page, the reactivation checkout, or Plan Selection.
 */
export type BillingStripGo = 'billing_home' | 'pay_link' | 'reactivate' | 'plans';

/** Who the strip speaks to: the Owner acts and sees amounts; a manager also hears the dunning. */
export type BillingStripAudience = 'owner' | 'manager' | 'member';

/** `M12-40` — the managers the dunning strip reaches beside the Owner. */
const DUNNING_MANAGERS: readonly RolePreset[] = ['sales_manager', 'project_manager'];

export function billingStripAudienceOf(roles: readonly RolePreset[]): BillingStripAudience {
  if (can(roles, 'billing.manage_billing')) return 'owner';
  return roles.some((role) => DUNNING_MANAGERS.includes(role)) ? 'manager' : 'member';
}

/**
 * One meter's step, as `GET /billing/usage/signals` says it. Both names are the wire's open sets: a
 * step a newer api adds draws nothing here until this release knows it.
 */
export interface StripSignal {
  readonly meter: string;
  readonly step: UsageStepName | (string & {});
  readonly pausesAt: number | null;
  readonly resetsAt: number | null;
}

export interface BillingStripInput {
  readonly phase: BillingPhase;
  readonly stateEnteredAt: number;
  readonly trialEndsAt: number | null;
  readonly signals: readonly StripSignal[];
  readonly audience: BillingStripAudience;
  readonly now: number;
}

/** The dunning ladder's rungs as the strip tells them: days 0–3, days 4–5, day 6 (`M12-39`). */
export type DunningRung = 'early' | 'metered' | 'final';

/** The ONE fact the shell's strip speaks: never two banners for one act (M12 §M12.4). */
export type BillingStripFact =
  | { readonly kind: 'none' }
  | { readonly kind: 'trial_chip'; readonly daysLeft: number }
  | { readonly kind: 'trial_prominent'; readonly daysLeft: number; readonly endsAt: number }
  | { readonly kind: 'dunning'; readonly rung: DunningRung; readonly day: number }
  | { readonly kind: 'halted' }
  | { readonly kind: 'expired' }
  | { readonly kind: 'cancelled' }
  | ({ readonly kind: 'cap' } & StripSignal & { readonly step: CapHeldStep });

const NONE: BillingStripFact = { kind: 'none' };

/**
 * The broadest true fact speaks: a billing state before a cap, the most severe cap first. The
 * quiet trial chip is no banner, so a cap that reached its limit speaks over it (`M12-30`: at 100%
 * a banner appears); from D-7 the trial's own strip speaks.
 */
export function billingStripFactOf(input: BillingStripInput): BillingStripFact {
  const state = stateFactOf(input);
  if (state.kind !== 'none' && state.kind !== 'trial_chip') return state;
  return capFactOf(input.signals) ?? state;
}

function stateFactOf({
  phase,
  stateEnteredAt,
  trialEndsAt,
  audience,
  now,
}: BillingStripInput): BillingStripFact {
  switch (phase) {
    case 'trialing': {
      if (trialEndsAt === null) return NONE;
      const daysLeft = Math.max(1, Math.ceil((trialEndsAt - now) / MS_PER_DAY));
      return daysLeft <= TRIAL_CHIP_PROMINENT_DAYS
        ? { kind: 'trial_prominent', daysLeft, endsAt: trialEndsAt }
        : { kind: 'trial_chip', daysLeft };
    }
    case 'past_due_full_function':
    case 'past_due_metered_paused': {
      if (audience === 'member') return NONE;
      const day = Math.floor((now - stateEnteredAt) / MS_PER_DAY);
      return { kind: 'dunning', rung: rungOf(phase, day), day };
    }
    case 'halted':
      return { kind: 'halted' };
    case 'expired':
      return { kind: 'expired' };
    case 'cancelled_post_period':
      return { kind: 'cancelled' };
    case 'active':
      return NONE;
  }
}

/** The phase decides whether the metered features paused; the day decides the final warning. */
function rungOf(phase: BillingPhase, day: number): DunningRung {
  if (phase === 'past_due_full_function') return 'early';
  return day >= FINAL_WARNING_DAY ? 'final' : 'metered';
}

function capFactOf(signals: readonly StripSignal[]): BillingStripFact | null {
  for (const step of CAP_HELD_STEPS) {
    const signal = signals.find((each) => each.step === step);
    if (signal !== undefined) return { kind: 'cap', ...signal, step };
  }
  return null;
}
