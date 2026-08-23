/**
 * NumberField's commit rules, once, for both platforms — MS12-26 / MS3-26.
 *
 * Empty or invalid NEVER commits: the field restores the last good value rather than writing a
 * broken one into a 3D model. Out of range has two answers and the caller picks one:
 * `clamp` announces the nearest legal value ("Rounded up to the 0.3 m minimum"), `refuse` writes
 * nothing and states the constraint (SCR-M11-03) — because an amount is a record of something
 * that happened, and a clamp puts a figure into a ledger that nobody typed.
 *
 * **Money display is not implemented here.** The design system reads the symbol, the grouping and
 * the fraction digits from the active market pack (`useFormat`), which `@heliogrid/ui` does not
 * have — see the folder's port notes. Every number is therefore printed as a plain number, in
 * both modes, rather than in an invented locale.
 */

import type { OutOfRangeMode } from './NumberField.types';

/** The edited representation. Editing is always a plain number — formatting never leaks in. */
export function displayNumber(value: number): string {
  return String(value);
}

/** The spoken representation of a bound: "0.3 m", "2500". */
export function formatBound(value: number, currency: boolean, unit?: string): string {
  if (currency) return String(value);
  return unit === undefined ? String(value) : `${value} ${unit}`;
}

/** "the amount has to be 1 or more" — the component owns the constraint clause and stops there. */
export function boundWords(opts: {
  currency: boolean;
  unit?: string;
  min?: number;
  max?: number;
}): string {
  const { currency, unit, min, max } = opts;
  const noun = currency ? 'the amount' : 'the value';
  if (min !== undefined && max !== undefined) {
    return `${noun} has to be between ${formatBound(min, currency, unit)} and ${formatBound(max, currency, unit)}`;
  }
  if (min !== undefined) return `${noun} has to be ${formatBound(min, currency, unit)} or more`;
  if (max !== undefined) return `${noun} can't be more than ${formatBound(max, currency, unit)}`;
  return `${noun} is out of range`;
}

export type NumberCommit =
  | { kind: 'restore' }
  | { kind: 'refuse'; constraint: string }
  | { kind: 'accept'; value: number; correction: string | null };

export interface NumberCommitInput {
  draft: string;
  /** The last good value — what a restore returns to. */
  value: number;
  min?: number;
  max?: number;
  precision?: number;
  currency: boolean;
  unit?: string;
  outOfRange: OutOfRangeMode;
  correctionMessage?: string;
}

function correctionFor(bound: number, kind: 'min' | 'max', input: NumberCommitInput): string {
  if (input.correctionMessage !== undefined) return input.correctionMessage;
  const suffix = !input.currency && input.unit !== undefined ? ` ${input.unit}` : '';
  return kind === 'min'
    ? `Rounded up to the ${bound}${suffix} minimum.`
    : `Capped at the ${bound}${suffix} maximum.`;
}

/** The whole of blur/Enter, as a decision the platform half only has to render. */
export function commitDraft(input: NumberCommitInput): NumberCommit {
  const { draft, min, max, precision, currency, unit, outOfRange } = input;
  const n = Number.parseFloat(draft);
  if (draft.trim() === '' || Number.isNaN(n)) return { kind: 'restore' };

  const below = min !== undefined && n < min;
  const above = max !== undefined && n > max;

  /* REFUSE: the last good value returns, the constraint is stated in place, and nothing the
     person did not type is written. */
  if (outOfRange === 'refuse' && (below || above)) {
    return {
      kind: 'refuse',
      constraint: `${formatBound(n, currency, unit)} can't be recorded — ${boundWords({ currency, unit, min, max })}. `,
    };
  }

  let v = n;
  let correction: string | null = null;
  if (below && min !== undefined) {
    v = min;
    correction = correctionFor(min, 'min', input);
  }
  if (above && max !== undefined) {
    v = max;
    correction = correctionFor(max, 'max', input);
  }
  if (precision !== undefined) v = Number(v.toFixed(precision));
  return { kind: 'accept', value: v, correction };
}

/** One press of +/− or ArrowUp/ArrowDown — always inside the bounds, never a refusal. */
export function nudgeValue(opts: {
  draft: string;
  value: number;
  direction: 1 | -1;
  step: number;
  min?: number;
  max?: number;
  precision?: number;
}): number {
  const { draft, value, direction, step, min, max, precision } = opts;
  const base = Number.parseFloat(draft);
  let v = (Number.isNaN(base) ? value : base) + direction * step;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  if (precision !== undefined) v = Number(v.toFixed(precision));
  return v;
}
