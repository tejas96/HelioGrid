import type { CollectionKind } from '../rails/pack';
import { type CapReading, capStepOf, capWarningReached } from './caps';
import type { TierLimit } from './tiers';
import { BYTES_PER_GB, storageRefuses } from './usage';

/**
 * Where one meter stands this cycle, as the usage screen says it (`SCR-M12-04`, `M12-30`,
 * `M12-34`): quiet, warned at 80%, at its cap, in its grace, paused, or past what a bundle
 * includes. `overage` is a bundle's, never a cap's — a bundle never pauses, it charges.
 */
export const USAGE_STEPS = ['clear', 'warning', 'at_cap', 'grace', 'paused', 'overage'] as const;
export type UsageStepName = (typeof USAGE_STEPS)[number];

/**
 * The steps where a meter stands at its cap (`M12-30`), most severe first: the ones a member may
 * see by name (`M12-56`), the shell's strip draws, and the usage screen offers bigger plans on.
 * `warning` is the usage screen's alone, and `overage` a bundle's.
 */
export const CAP_HELD_STEPS = [
  'paused',
  'grace',
  'at_cap',
] as const satisfies readonly UsageStepName[];
export type CapHeldStep = (typeof CAP_HELD_STEPS)[number];

export interface UsageStep {
  readonly step: UsageStepName;
  /** `grace`: the moment new creations of the type pause. */
  readonly pausesAt: number | null;
  /** `paused`: the moment the cycle resets the count; `null` where only an upgrade lifts it. */
  readonly resetsAt: number | null;
}

const step = (name: UsageStepName): UsageStep => ({ step: name, pausesAt: null, resetsAt: null });

/** A capped count — proposals, active projects, a trial's voice minutes — on the cap ladder. */
export function cappedUsageStep(reading: CapReading): UsageStep {
  const ladder = capStepOf(reading);
  if (ladder.step === 'grace') return { ...step('grace'), pausesAt: ladder.pausesAt };
  if (ladder.step === 'paused') return { ...step('paused'), resetsAt: ladder.resetsAt };
  return step(ladder.step);
}

/**
 * A bundle with a rate beyond it (`BM-41`: Pro's 400 voice minutes, then ₹6 a minute; Starter's
 * pay as you go, a bundle of 0): warned at 80%, then `overage` once a unit is used past it.
 */
export function bundleUsageStep(used: number, bundle: TierLimit): UsageStep {
  if (typeof bundle === 'number' && used > bundle) return step('overage');
  return capWarningReached(used, bundle) ? step('warning') : step('clear');
}

/**
 * The storage gauge against its ceiling (`BM-20`): warned at 80%, at its cap from 100%, and
 * paused once the upload gate refuses — `storageRefuses`, the gate's own rule. A gauge has no
 * cycle, so a pause lifts only when files are removed or the plan grows.
 */
export function storageUsageStep(gaugeBytes: number, limitGb: TierLimit): UsageStep {
  if (typeof limitGb !== 'number') return step('clear');
  if (storageRefuses(gaugeBytes, limitGb)) return step('paused');
  const limitBytes = limitGb * BYTES_PER_GB;
  if (limitBytes > 0 && gaugeBytes >= limitBytes) return step('at_cap');
  return capWarningReached(gaugeBytes, limitBytes) ? step('warning') : step('clear');
}

/**
 * The payment that carries this period's extra charges (`M12-35`). A period is reckoned a settle
 * day after it closes, and an add-on joins a mandate's debit only while that debit is days away
 * (`ADD_ON_LEAD_DAYS`), so the debit at the period's end has already gone: a mandate carries it
 * on the debit after. An invoice company's renewal link is raised after the settle day and
 * carries every closed month's add-ons, so it bills at the period's end.
 */
export function overageBillsOn(
  collection: CollectionKind,
  periods: { readonly paidPeriodEnd: number; readonly nextPeriodEnd: number },
): number {
  return collection === 'mandate' ? periods.nextPeriodEnd : periods.paidPeriodEnd;
}
