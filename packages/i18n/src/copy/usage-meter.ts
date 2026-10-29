/**
 * The `UsageMeter` words the meter composes itself (`packages/ui`'s `UsageMeterWords`): its
 * unmetered, unresolved, failed and unavailable lines, the figure's *of*, the track's names and
 * value, and the one status sentence per billing situation (`SCR-M12-04`, `M12-36`). The figures
 * arrive formatted; `bundle` is the screen's bundle name where it has one.
 */
import type { Translator } from '../runtime';

const USAGE_METER = {
  noLimit: /*i18n*/ {
    id: 'No bundle on this plan to measure against — this is a count, not a rate.',
  },
  loading: /*i18n*/ { id: "Not resolved yet — this period's rollup is still being read." },
  error: /*i18n*/ {
    id: "Couldn't read this period's usage. Nothing is shown until it resolves, because this screen only ever shows the billed figures.",
  },
  unavailable: /*i18n*/ { id: 'Not metered on this plan' },
  ofLimit: /*i18n*/ { id: 'of {limit}' },
  ofLimitUnit: /*i18n*/ { id: 'of {limit} {unit}' },
  named: /*i18n*/ { id: '{label}, {period}' },
  value: /*i18n*/ { id: '{value} of {limit}' },
  valueUnit: /*i18n*/ { id: '{value} of {limit} {unit}' },
  valueBeyond: /*i18n*/ { id: '{value} of {limit}, {overage} beyond the bundle' },
  valueUnitBeyond: /*i18n*/ { id: '{value} of {limit} {unit}, {overage} beyond the bundle' },
  unresolved: /*i18n*/ { id: '{label}, not resolved yet' },
  unresolvedPeriod: /*i18n*/ { id: '{label}, {period}, not resolved yet' },
  threshold: /*i18n*/ { id: '{percent}% warning threshold' },
  paused: /*i18n*/ { id: 'Paused — the cap was reached and the grace period has ended.' },
  pausedOnPlan: /*i18n*/ { id: 'Paused — new creations are blocked on this plan.' },
  capReached: /*i18n*/ {
    id: 'Cap reached. {days, plural, one {# day} other {# days}} of grace left before new creations pause.',
  },
  capReachedRunning: /*i18n*/ {
    id: 'Cap reached. Grace period running before new creations pause.',
  },
  overage: /*i18n*/ { id: '{overage} beyond the bundle — billed as overage this period.' },
  overageUnit: /*i18n*/ {
    id: '{overage} {unit} beyond the bundle — billed as overage this period.',
  },
  overageBundle: /*i18n*/ { id: '{overage} beyond {bundle} — billed as overage this period.' },
  overageUnitBundle: /*i18n*/ {
    id: '{overage} {unit} beyond {bundle} — billed as overage this period.',
  },
  seats: /*i18n*/ { id: '{overage} tracked beyond the bundle — billed per seat this period.' },
  seatsBundle: /*i18n*/ {
    id: '{overage} tracked beyond {bundle} — billed per seat this period.',
  },
  nearing: /*i18n*/ { id: '{percent}% of the bundle used.' },
  nearingBundle: /*i18n*/ { id: '{percent}% of {bundle} used.' },
} as const;

/** Every word `UsageMeter` composes, in the reader's language. */
export function usageMeterWords(t: Translator['t']) {
  return {
    noLimit: t(USAGE_METER.noLimit),
    loading: t(USAGE_METER.loading),
    error: t(USAGE_METER.error),
    unavailable: t(USAGE_METER.unavailable),
    ofLimit: (limit: string, unit?: string) =>
      unit === undefined
        ? t(USAGE_METER.ofLimit, { limit })
        : t(USAGE_METER.ofLimitUnit, { limit, unit }),
    named: (label: string, period: string) => t(USAGE_METER.named, { label, period }),
    valueText: (value: string, limit: string, unit?: string, overage?: string) => {
      if (overage === undefined) {
        return unit === undefined
          ? t(USAGE_METER.value, { value, limit })
          : t(USAGE_METER.valueUnit, { value, limit, unit });
      }
      return unit === undefined
        ? t(USAGE_METER.valueBeyond, { value, limit, overage })
        : t(USAGE_METER.valueUnitBeyond, { value, limit, unit, overage });
    },
    unresolvedName: (label: string, period?: string) =>
      period === undefined
        ? t(USAGE_METER.unresolved, { label })
        : t(USAGE_METER.unresolvedPeriod, { label, period }),
    threshold: (percent: number) => t(USAGE_METER.threshold, { percent }),
    paused: t(USAGE_METER.paused),
    pausedOnPlan: t(USAGE_METER.pausedOnPlan),
    capReached: (graceDaysLeft?: number) =>
      graceDaysLeft === undefined
        ? t(USAGE_METER.capReachedRunning)
        : t(USAGE_METER.capReached, { days: graceDaysLeft }),
    overage: (overage: string, unit?: string, bundle?: string) => {
      if (bundle === undefined) {
        return unit === undefined
          ? t(USAGE_METER.overage, { overage })
          : t(USAGE_METER.overageUnit, { overage, unit });
      }
      return unit === undefined
        ? t(USAGE_METER.overageBundle, { overage, bundle })
        : t(USAGE_METER.overageUnitBundle, { overage, unit, bundle });
    },
    trackedSeats: (overage: string, bundle?: string) =>
      bundle === undefined
        ? t(USAGE_METER.seats, { overage })
        : t(USAGE_METER.seatsBundle, { overage, bundle }),
    nearing: (percent: number, bundle?: string) =>
      bundle === undefined
        ? t(USAGE_METER.nearing, { percent })
        : t(USAGE_METER.nearingBundle, { percent, bundle }),
  };
}
