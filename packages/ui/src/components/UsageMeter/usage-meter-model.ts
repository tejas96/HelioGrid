import type { UsageBillingState, UsageState } from './UsageMeter.types';

/** The FILL only. Words never rely on it (F7-12). */
export type UsageFill = 'accent' | 'info' | 'warning' | 'neutral';

/** The status sentence's colour role. The sentence itself always carries the meaning. */
export type UsageLineTone = 'danger' | 'warning' | 'info';

export interface UsageLine {
  words: string;
  tone: UsageLineTone;
}

/**
 * `ready` is the shared surface vocabulary's name for "nothing is wrong"; this meter's own word is
 * `ok`. Both mean the ordinary case, so a caller threading one `state` through several surfaces
 * does not have to translate.
 */
export function normaliseUsageState(state: UsageState): Exclude<UsageState, 'ready'> {
  return state === 'ready' ? 'ok' : state;
}

/**
 * RULE 1 — NO FIGURE WITHOUT A RESOLVED VALUE. A non-finite `value` is treated as unresolved
 * however it arrived, so a caller cannot print a fabricated rollup by omission.
 */
export function isResolved(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** RULE 2 — NO DENOMINATOR WITHOUT A RATE. No positive limit means unmetered, not zero-capped. */
export function isMetered(limit: number | null | undefined): limit is number {
  return typeof limit === 'number' && Number.isFinite(limit) && limit > 0;
}

const STATE_FILL: Record<UsageBillingState, UsageFill> = {
  ok: 'accent',
  'overage-accruing': 'info',
  'tracked-seats-accruing': 'info',
  'cap-reached-grace': 'warning',
  'creations-paused': 'neutral',
};

export interface UsageScale {
  overage: number;
  usedPct: number;
  overPct: number;
  limitMark: number;
  threshold: number;
  pctOfLimit: number;
  nearing: boolean;
  fill: UsageFill;
  scaleMax: number;
}

/** M12-35 — overage accrues VISIBLY, so 100% is not the end of the scale; the track re-scales. */
export function usageScale(
  value: number,
  limit: number,
  thresholdPercent: number,
  state: UsageBillingState,
): UsageScale {
  const overage = Math.max(0, value - limit);
  const scaleMax = Math.max(limit, value);
  const pctOfLimit = Math.round((value / limit) * 100);
  const nearing = state === 'ok' && pctOfLimit >= thresholdPercent;
  return {
    overage,
    scaleMax,
    usedPct: (Math.min(value, limit) / scaleMax) * 100,
    overPct: (overage / scaleMax) * 100,
    limitMark: (limit / scaleMax) * 100,
    threshold: ((limit * (thresholdPercent / 100)) / scaleMax) * 100,
    pctOfLimit,
    nearing,
    fill: nearing ? 'warning' : STATE_FILL[state],
  };
}

function capSentence(graceDaysLeft: number | undefined): string {
  const grace =
    graceDaysLeft === undefined ? 'Grace period running' : `${graceDaysLeft} days of grace left`;
  return `Cap reached. ${grace} before new creations pause.`;
}

/**
 * One sentence, stated plainly, carrying the whole billing situation in words. M12-36 — the meter
 * REPORTS, it never alarms: overage is info because it is expected, billable behaviour rather than
 * a fault, and a paused meter puts the severity in the words rather than in a shout.
 */
export function usageStatusLine(
  state: UsageBillingState,
  scale: UsageScale,
  format: (value: number) => string,
  unit: string | undefined,
  bundleName: string | undefined,
  graceDaysLeft: number | undefined,
): UsageLine | null {
  const bundle = bundleName ?? 'the bundle';
  if (state === 'creations-paused') {
    return {
      words: 'Paused — the cap was reached and the grace period has ended.',
      tone: 'danger',
    };
  }
  if (state === 'cap-reached-grace') {
    return { words: capSentence(graceDaysLeft), tone: 'warning' };
  }
  if (state === 'overage-accruing') {
    const words = `${format(scale.overage)} ${unit ?? ''} beyond ${bundle} — billed as overage this period.`;
    return { words: words.replace(/\s+/g, ' '), tone: 'info' };
  }
  if (state === 'tracked-seats-accruing') {
    return {
      words: `${format(scale.overage)} tracked beyond ${bundle} — billed per seat this period.`,
      tone: 'info',
    };
  }
  if (scale.nearing) {
    return { words: `${scale.pctOfLimit}% of ${bundle} used.`, tone: 'warning' };
  }
  return null;
}

/** The unmetered case keeps the two cap sentences; everything derived from a rate is gone. */
export function unmeteredStatusLine(
  state: UsageBillingState,
  graceDaysLeft: number | undefined,
): UsageLine | null {
  if (state === 'creations-paused') {
    return { words: 'Paused — new creations are blocked on this plan.', tone: 'danger' };
  }
  if (state === 'cap-reached-grace') {
    return { words: capSentence(graceDaysLeft), tone: 'warning' };
  }
  return null;
}
