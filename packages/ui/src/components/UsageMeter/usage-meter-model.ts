import type { TranslatedText } from '@heliogrid/contracts';
import type {
  UsageBillingState,
  UsageMeterProps,
  UsageMeterWords,
  UsageState,
} from './UsageMeter.types';

/** The FILL only. Words never rely on it (F7-12). */
export type UsageFill = 'accent' | 'info' | 'warning' | 'neutral';

/** The status sentence's colour role. The sentence itself always carries the meaning. */
export type UsageLineTone = 'danger' | 'warning' | 'info';

export interface UsageLine {
  words: TranslatedText;
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
  words: UsageMeterWords,
): UsageLine | null {
  if (state === 'creations-paused') {
    return { words: words.paused, tone: 'danger' };
  }
  if (state === 'cap-reached-grace') {
    return { words: words.capReached(graceDaysLeft), tone: 'warning' };
  }
  if (state === 'overage-accruing') {
    return { words: words.overage(format(scale.overage), unit, bundleName), tone: 'info' };
  }
  if (state === 'tracked-seats-accruing') {
    return { words: words.trackedSeats(format(scale.overage), bundleName), tone: 'info' };
  }
  if (scale.nearing) {
    return { words: words.nearing(scale.pctOfLimit, bundleName), tone: 'warning' };
  }
  return null;
}

/** The unmetered case keeps the two cap sentences; everything derived from a rate is gone. */
export function unmeteredStatusLine(
  state: UsageBillingState,
  graceDaysLeft: number | undefined,
  words: UsageMeterWords,
): UsageLine | null {
  if (state === 'creations-paused') {
    return { words: words.pausedOnPlan, tone: 'danger' };
  }
  if (state === 'cap-reached-grace') {
    return { words: words.capReached(graceDaysLeft), tone: 'warning' };
  }
  return null;
}

/**
 * What the meter draws, checked in the documented order: `error` and `unavailable` first, then a
 * wait while loading or unresolved, then the figure — against a limit only when one is metered.
 */
export type UsageMeterShape =
  | { draws: 'error' }
  | { draws: 'unavailable' }
  | { draws: 'loading' }
  | { draws: 'unmetered'; billing: UsageBillingState; value: number }
  | { draws: 'metered'; billing: UsageBillingState; value: number; limit: number };

export function usageMeterShape(
  state: UsageState,
  value: number | undefined,
  limit: number | null | undefined,
): UsageMeterShape {
  const billing = normaliseUsageState(state);
  if (billing === 'error') {
    return { draws: 'error' };
  }
  if (billing === 'unavailable') {
    return { draws: 'unavailable' };
  }
  if (billing === 'loading' || !isResolved(value)) {
    return { draws: 'loading' };
  }
  return isMetered(limit)
    ? { draws: 'metered', billing, value, limit }
    : { draws: 'unmetered', billing, value };
}

/** The track's thickness: the functional density's is the thinner. */
export function usageTrackHeight(density: NonNullable<UsageMeterProps['density']>): number {
  return density === 'functional' ? 8 : 10;
}

/** The wait's one line: what is loading, then the period it is for. */
export function usageLoadingLine(loadingNote: TranslatedText, period: string | undefined): string {
  return [loadingNote, period].filter((part) => part !== undefined).join(' · ');
}

/** What a metered meter knows, on either platform. */
export interface UsageMeterMeteredFacts {
  words: UsageMeterWords;
  label: TranslatedText;
  value: number;
  limit: number;
  unit?: TranslatedText;
  period?: string;
  bundleName?: TranslatedText;
  billing: UsageBillingState;
  thresholdPercent: number;
  graceDaysLeft?: number;
  note?: TranslatedText;
  format: (value: number) => string;
}

/** The metered figure read once: its scale, its status sentence and what the track says aloud. */
export function meteredReading({
  words,
  label,
  value,
  limit,
  unit,
  period,
  bundleName,
  billing,
  thresholdPercent,
  graceDaysLeft,
  format,
}: UsageMeterMeteredFacts): {
  scale: UsageScale;
  line: UsageLine | null;
  trackName: TranslatedText;
  valueText: TranslatedText;
} {
  const scale = usageScale(value, limit, thresholdPercent, billing);
  const line = usageStatusLine(billing, scale, format, unit, bundleName, graceDaysLeft, words);
  const beyond = scale.overage > 0 ? format(scale.overage) : undefined;
  return {
    scale,
    line,
    trackName: period === undefined ? label : words.named(label, period),
    valueText: words.valueText(format(value), format(limit), unit, beyond),
  };
}

/** Which marks the track draws: the overage, the threshold tick inside the bar, the bundle's edge. */
export function usageTrackMarks(scale: UsageScale): {
  drawsOver: boolean;
  drawsTick: boolean;
  drawsBundleMark: boolean;
} {
  return {
    drawsOver: scale.overPct > 0,
    drawsTick: scale.threshold > 0 && scale.threshold < 100,
    drawsBundleMark: scale.overPct > 0 && scale.limitMark < 100,
  };
}
