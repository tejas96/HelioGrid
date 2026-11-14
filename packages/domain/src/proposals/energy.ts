import type { MonthlyFigures, PerformanceFields } from './field-set';

/**
 * A system's generation from what the energy source answered (`M06-10`, `T-M06-033`). The source
 * is asked once per point for 1 kWp at ZERO system loss; the size and step 4's efficiency are
 * applied here, once, so losses are never taken twice. Energy, never money — a screen may read it.
 */

export const MONTHS_PER_YEAR = 12;

/** The system's kWh for each month: the person's own figures where they typed them, else the source's. */
export function systemMonthlyKwh(
  performance: PerformanceFields,
  capacityKw: number | null,
): MonthlyFigures | null {
  if (performance.editedMonthlyKwh !== null) return performance.editedMonthlyKwh;
  if (performance.yieldPerKwp === null || capacityKw === null) return null;
  const factor = (capacityKw * performance.efficiencyPercent) / 100;
  return performance.yieldPerKwp.map((kwh) => kwh * factor);
}

/** A year's kWh from its twelve months. */
export function yearlyKwh(months: MonthlyFigures): number {
  return months.reduce((total, kwh) => total + kwh, 0);
}

/** The month that generates most, January as 0 — the bar the generation chart marks. */
export function bestMonth(months: MonthlyFigures): number {
  return months.reduce((best, kwh, month) => (kwh > (months[best] ?? 0) ? month : best), 0);
}

/**
 * The size changed after the person typed their own month figures (`T-M06-033`): the figures stay,
 * and the step says "Capacity changed — Reset to AI values".
 */
export function capacityChangedSinceEdit(
  performance: PerformanceFields,
  capacityKw: number | null,
): boolean {
  return (
    performance.editedMonthlyKwh !== null &&
    performance.editedAtCapacityKw !== null &&
    performance.editedAtCapacityKw !== capacityKw
  );
}

/** Whether a value is twelve finite, non-negative figures — what a month row may hold. */
export function isMonthlyFigures(value: readonly number[]): boolean {
  return value.length === MONTHS_PER_YEAR && value.every((kwh) => Number.isFinite(kwh) && kwh >= 0);
}
