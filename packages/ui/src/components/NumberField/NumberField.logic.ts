import type { TranslatedText } from '@heliogrid/contracts';
import type { MarketFormat } from '../../utils/format';
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

import type { NumberFieldWords, OutOfRangeMode } from './NumberField.types';

/** The edited representation. Editing is always a plain number — formatting never leaks in; an unset field edits as nothing. */
/**
 * A money figure while its field rests: whole rupees as the screen writes them, paise kept — to the
 * minor unit — wherever the figure has them, so the field never reads a rounded amount.
 */
export function restingMoney(format: Pick<MarketFormat, 'money' | 'pack'>, figure: number): string {
  return format.money(figure, {
    fractionDigits: Number.isInteger(figure) ? 0 : format.pack.minorUnitDigits,
  });
}

export function displayNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

/** The spoken representation of a bound: "0.3 m", "2500". */
export function formatBound(value: number, currency: boolean, unit?: string): string {
  if (currency) return String(value);
  return unit === undefined ? String(value) : `${value} ${unit}`;
}

/** "12 can't be recorded — the amount has to be 1 or more": the component owns the constraint and stops there. */
function refusalOf(n: number, input: NumberCommitInput): TranslatedText {
  const { currency, unit, min, max } = input;
  return input.words.refused({
    figure: formatBound(n, currency, unit),
    money: currency,
    ...(min === undefined ? {} : { min: formatBound(min, currency, unit) }),
    ...(max === undefined ? {} : { max: formatBound(max, currency, unit) }),
  });
}

export type NumberCommit =
  | { kind: 'restore' }
  | { kind: 'refuse'; constraint: TranslatedText }
  | { kind: 'accept'; value: number; correction: TranslatedText | null };

export interface NumberCommitInput {
  draft: string;
  /** The last good value — what a restore returns to; none on an unset field. */
  value: number | undefined;
  min?: number;
  max?: number;
  precision?: number;
  currency: boolean;
  unit?: string;
  outOfRange: OutOfRangeMode;
  correctionMessage?: TranslatedText;
  words: Pick<NumberFieldWords, 'roundedUp' | 'capped' | 'refused'>;
}

function correctionFor(
  bound: number,
  kind: 'min' | 'max',
  input: NumberCommitInput,
): TranslatedText {
  if (input.correctionMessage !== undefined) return input.correctionMessage;
  const shown = formatBound(bound, input.currency, input.unit);
  return kind === 'min' ? input.words.roundedUp(shown) : input.words.capped(shown);
}

/** The whole of blur/Enter, as a decision the platform half only has to render. */
export function commitDraft(input: NumberCommitInput): NumberCommit {
  const { draft, min, max, precision, outOfRange } = input;
  const n = Number.parseFloat(draft);
  if (draft.trim() === '' || Number.isNaN(n)) return { kind: 'restore' };

  const below = min !== undefined && n < min;
  const above = max !== undefined && n > max;

  /* REFUSE: the last good value returns, the constraint is stated in place, and nothing the
     person did not type is written. */
  if (outOfRange === 'refuse' && (below || above)) {
    return { kind: 'refuse', constraint: refusalOf(n, input) };
  }

  let v = n;
  let correction: TranslatedText | null = null;
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

/**
 * One press of +/− or ArrowUp/ArrowDown — always inside the bounds, never a refusal. From an unset
 * field a press is one step from 0, and the bounds then hold it: with a floor the first press lands
 * on the floor, the first figure a person would reach for.
 */
export function nudgeValue(opts: {
  draft: string;
  value: number | undefined;
  direction: 1 | -1;
  step: number;
  min?: number;
  max?: number;
  precision?: number;
}): number {
  const { draft, value, direction, step, min, max, precision } = opts;
  const base = Number.parseFloat(draft);
  let v = (Number.isNaN(base) ? (value ?? 0) : base) + direction * step;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  if (precision !== undefined) v = Number(v.toFixed(precision));
  return v;
}
