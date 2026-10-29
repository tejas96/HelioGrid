import type { TranslatedText } from '@heliogrid/contracts';
import type { RangeFieldProps, RangeValue } from './RangeField.types';

/** Snap to the step and keep the step's own decimal precision — 0.05 must not print 0.30000000004. */
export function roundToStep(value: number, step: number): number {
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Number((Math.round(value / step) * step).toFixed(decimals));
}

/** True when a pair still covers its whole span — an untouched dimension, which nothing counts. */
export function rangeIsAny(
  value: RangeValue | null | undefined,
  min: number,
  max: number,
): boolean {
  if (value === null || value === undefined) return true;
  return value[0] <= min && value[1] >= max;
}

/** `null` means the whole span, which is what an untouched filter dimension is. */
export function resolveRange(
  value: RangeValue | null | undefined,
  min: number,
  max: number,
): RangeValue {
  return value === null || value === undefined ? [min, max] : value;
}

/** The pair, ordered — the value is always low-then-high whichever handle produced it. */
export function orderPair(next: RangeValue): RangeValue {
  return [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
}

/** Pinned, never swapped: the handle you are holding stays the handle you are holding. */
export function pinnedPair(end: 'lo' | 'hi', next: number, [lo, hi]: RangeValue): RangeValue {
  return end === 'lo' ? [Math.min(next, hi), hi] : [lo, Math.max(next, lo)];
}

/** The pair, ordered, to `onInput` while it moves and to `onCommit` once it lands. */
export function reportRange(
  next: RangeValue,
  live: boolean,
  { onInput, onCommit }: Pick<RangeFieldProps, 'onInput' | 'onCommit'>,
): void {
  const pair = orderPair(next);
  if (live) onInput?.(pair);
  else onCommit?.(pair);
}

/** "300 W", or whatever `format` says. */
export function formatEnd(
  value: number,
  format?: (value: number) => string,
  unit?: string,
): string {
  if (format !== undefined) return format(value);
  return unit === undefined ? String(value) : `${value} ${unit}`;
}

/** The readout: the span in figures, or `anyLabel` while the pair still covers everything. */
export function rangeReadout(opts: {
  lo: number;
  hi: number;
  min: number;
  max: number;
  anyLabel: TranslatedText | undefined;
  unit?: string;
  format?: (value: number) => string;
}): string {
  const { lo, hi, min, max, anyLabel, unit, format } = opts;
  if (rangeIsAny([lo, hi], min, max)) return anyLabel ?? '';
  const low = format !== undefined ? format(lo) : String(lo);
  return `${low} – ${formatEnd(hi, format, unit)}`;
}

/** A thumb's accessible name: the field's name and the end it holds — "Wattage — From". */
export function thumbName(label: TranslatedText | undefined, end: TranslatedText): string {
  return label === undefined ? end : `${label} — ${end}`;
}

/** A commit-once box: empty or garbage restores, anything else clamps into its own window. */
export function commitEnd(draft: string, min: number, max: number, step: number) {
  const n = Number.parseFloat(draft);
  if (draft.trim() === '' || Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, roundToStep(n, step)));
}
