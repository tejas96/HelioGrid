import type { CallerLineSeries, TrafficClass } from './pack';

/**
 * `F1-37` — which caller line may carry which class of traffic. The series is a property of the
 * NATIONAL number, so the caller strips the market's dial code first with `nationalNumber()`; one
 * derivation serves display and this check, and the two cannot disagree about where the code ends.
 *
 * The rule is the market's, never a vendor's: no behaviour anywhere branches on a telephony
 * provider's name (`M07-54`). `M07` selects the line and words the refusal; this answers whether
 * the market permits it.
 */

/** A forbidden series wins over a required one — a closed series is closed to every class. */
export function isCallerLineAllowed(
  series: CallerLineSeries,
  trafficClass: TrafficClass,
  national: string,
): boolean {
  if (series.forbidden.some((prefix) => national.startsWith(prefix))) return false;
  const required = series.requiredByClass[trafficClass];
  return required === null || national.startsWith(required);
}
