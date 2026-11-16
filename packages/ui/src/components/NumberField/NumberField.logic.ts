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
 * A money figure while its field rests: whole rupees grouped as the market writes them, paise kept
 * — to the minor unit — wherever the figure has them, so the field never reads a rounded amount.
 * No symbol: the field's adornment carries it (`CurrencyMark`), and a second read "₹ | ₹14,900".
 */
export function restingMoney(
  format: Pick<MarketFormat, 'number' | 'pack'>,
  figure: number,
): string {
  const digits = Number.isInteger(figure) ? 0 : format.pack.minorUnitDigits;
  return format.number(figure, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/**
 * A field with a `precision` shows its figure to that many places: a figure the server worked out
 * (405.52799999999996 kWh) reads as the field would commit it (406), never as a float. Only shown —
 * the figure is sent again only when the person changes the text (`useNumberFieldDraft`).
 */
export function displayNumber(value: number | undefined, precision?: number): string {
  if (value === undefined) return '';
  return precision === undefined ? String(value) : String(Number(value.toFixed(precision)));
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

/**
 * The figure a draft holds — the whole draft or nothing (`NaN`): grouping a person typed or kept
 * from the resting money text ("1,50,000", a space, a no-break space) is dropped first, and then
 * every character must be part of the number. `parseFloat` read "30,00,0000" as 30 and saved a
 * figure never typed. The editing draft is always a plain `.`-decimal number, so a comma is never
 * a decimal mark here.
 */
export function draftFigureOf(draft: string): number {
  const plain = draft.replace(/[,\s\u00a0\u202f]/g, '');
  return plain === '' ? Number.NaN : Number(plain);
}

/**
 * What a figure field keeps of what was typed: digits, grouping, one point, and a leading minus
 * only where the field takes a figure below zero. A letter or a second point is not taken, so the
 * box never holds a draft that can only be refused.
 */
export function typedFigureOf(edited: string, takesNegative: boolean): string {
  let pointSeen = false;
  let kept = '';
  for (const character of edited) {
    if (/[0-9,\s\u00a0\u202f]/.test(character)) kept += character;
    else if (character === '.' && !pointSeen) {
      pointSeen = true;
      kept += character;
    } else if (character === '-' && takesNegative && kept === '') kept += character;
  }
  return kept;
}

/** How many digits a figure or a draft holds before its point, leading zeros and grouping left out. */
export function wholeDigitsOf(draft: string): number {
  const [whole = ''] = draft.replace(/[,\s\u00a0\u202f]/g, '').split('.');
  return whole.replace(/\D/g, '').replace(/^0+/, '').length;
}

/** How many characters two texts share from their start. */
function sharedHeadLength(a: string, b: string): number {
  let length = 0;
  while (length < a.length && length < b.length && a[length] === b[length]) length += 1;
  return length;
}

/**
 * The draft a field keeps from one edit. Characters ADDED to the draft never carry it past the
 * field's whole digits — those digits are not taken, however many arrive in one change, because a
 * phone hands `onChangeText` several keystrokes at once when they come faster than a render. Text
 * that REPLACES the draft (a paste over it, a paste into an empty field) is kept as it came, so it
 * can be seen beside the caller's error.
 */
export function draftWithinWholeDigits(
  previous: string,
  next: string,
  wholeDigits: number,
): string {
  if (wholeDigitsOf(next) <= wholeDigits) return next;
  const head = sharedHeadLength(previous, next);
  const tail = previous.slice(head);
  const addedEnd = next.length - tail.length;
  const replaced = previous === '' || addedEnd < head || !next.endsWith(tail);
  if (replaced) return next;
  let taken = '';
  for (const character of next.slice(head, addedEnd)) {
    const candidate = previous.slice(0, head) + taken + character + tail;
    if (wholeDigitsOf(candidate) <= wholeDigits) taken += character;
  }
  return previous.slice(0, head) + taken + tail;
}

/** The whole of blur/Enter, as a decision the platform half only has to render. */
export function commitDraft(input: NumberCommitInput): NumberCommit {
  const { draft, min, max, precision, outOfRange } = input;
  const n = draftFigureOf(draft);
  if (draft.trim() === '' || !Number.isFinite(n)) return { kind: 'restore' };

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
  const base = draftFigureOf(draft);
  let v = (Number.isFinite(base) ? base : (value ?? 0)) + direction * step;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  if (precision !== undefined) v = Number(v.toFixed(precision));
  return v;
}

/**
 * What a `plain` figure with no value shows: it has no well to read as a field, so an empty one
 * would be nothing at all to tap. A mark, not a word, and no value it was not told.
 */
export const EMPTY_PLAIN_FIGURE = '—';
