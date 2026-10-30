import {
  BILLING_CAPABILITIES,
  type BillingCapability,
  type BillingPhase,
  capabilityStanding,
} from './soft-block';

/** The one act that ends a pause: settle the failed charge, start again, or pick a first plan. */
export const RESOLVING_ACTS = ['pay', 'reactivate', 'pick_plan'] as const;
export type ResolvingAct = (typeof RESOLVING_ACTS)[number];

/**
 * `M12-31`, `F8-34` — what a billing phase has paused, what still works, and the act that ends
 * it. Both lists are read off the matrix, never written a second time, so the words a person reads
 * cannot claim a block the gate does not make, or miss one it does.
 */
export interface PauseNotice {
  readonly paused: readonly BillingCapability[];
  readonly stillWorks: readonly BillingCapability[];
  readonly act: ResolvingAct | null;
}

/**
 * An exhaustive `Record`, so a new phase names its act before it compiles. A trial that ran out
 * has never paid, so its act is a first plan; a halted or cancelled company starts again.
 */
const ACT: Record<BillingPhase, ResolvingAct | null> = {
  trialing: null,
  active: null,
  past_due_full_function: 'pay',
  past_due_metered_paused: 'pay',
  halted: 'reactivate',
  expired: 'pick_plan',
  cancelled_post_period: 'reactivate',
};

export function pauseNoticeOf(phase: BillingPhase): PauseNotice {
  const paused = (capability: BillingCapability) =>
    capabilityStanding(capability, phase) === 'paused';
  return {
    paused: BILLING_CAPABILITIES.filter(paused),
    stillWorks: BILLING_CAPABILITIES.filter((capability) => !paused(capability)),
    act: ACT[phase],
  };
}
