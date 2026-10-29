/**
 * Snap to the step, keeping the step's own decimal precision — 0.1 steps must not accumulate
 * float dust into "1.7000000000000002" on a value a surveyor reads.
 */
export function roundToStep(value: number, step: number): number {
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Number((Math.round(value / step) * step).toFixed(decimals));
}

/** Snap, then hold inside the permitted range. */
export function clampToRange(value: number, min: number, max: number, step: number): number {
  return Math.min(max, Math.max(min, roundToStep(value, step)));
}

/** How much of the track is filled, 0–100. A degenerate range reads as empty, never as NaN. */
export function fillPercent(value: number, min: number, max: number): number {
  const span = max - min;
  const raw = ((value - min) / (span === 0 ? 1 : span)) * 100;
  return Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
}

/** The words beside the label — the formatter wins, else the value with its unit. */
export function formatValue(
  value: number,
  unit: string | undefined,
  format: ((value: number) => string) | undefined,
): string {
  if (format !== undefined) {
    return format(value);
  }
  return unit === undefined ? String(value) : `${value} ${unit}`;
}

/** One step from `value` in `direction` (−1 or +1), snapped and held inside the range. */
export function nudged(
  value: number,
  direction: number,
  min: number,
  max: number,
  step: number,
): number {
  return clampToRange(value + direction * step, min, max, step);
}

/** A stepper is off when the slider is, or when the value already sits at its end of the range. */
export function stepperOff(
  direction: -1 | 1,
  value: number,
  min: number,
  max: number,
  disabled: boolean,
): boolean {
  return disabled || (direction < 0 ? value <= min : value >= max);
}
