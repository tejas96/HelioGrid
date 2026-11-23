import { feetAndInches, metresOfFeetAndInches } from '../format/measurement';
import type { MeasurementSystem } from '../format/pack';
import type { SetEdgeTrust, StudioDocument } from './document';
import { planSizedByLength } from './plan-sizing';
import type { EditResult } from './roof-check';
import { LENGTH_MIN_M, lengthSet } from './roof-length';
import { edgeLengths } from './roof-shape';

/**
 * The length box of the roof step (`T-M05-002`, part b): a length as a person types it — metres in
 * one box, or feet and inches in two — what it would make of the design, and the small steps of −
 * and +: five centimetres, or an inch.
 */

/** A length as typed in the box: metres in one box, or feet and inches in two. */
export interface LengthEntry {
  readonly main: string;
  readonly inches: string;
  readonly measured: boolean;
}

/** The edge in the box: which roof, which edge, and the design as it stood when the box opened. */
export interface LengthInHand {
  readonly roof: number;
  readonly edge: number;
  readonly base: StudioDocument;
  readonly entry: LengthEntry;
  /** The roofs made from a plan laid at our guess (`roofsOnPlan`): a length on one sizes the plan. */
  readonly planRoofs?: readonly number[];
}

const STEP_M = 0.05;
const STEP_IN = 0.0254;
/** The slider runs this share either side of the picture's length; a length past it is typed. */
export const LENGTH_SLIDE_SHARE = 0.3;

/** The slider for a length: its ends, its step, and the picture's length marked on its track. */
export interface LengthSlide {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly mark: number;
}

/**
 * The length slider (`T-M05-002`, *Values*): the picture's length ± 30 %, never under the shortest
 * edge, in steps of 5 cm or an inch; the picture's own length is the mark on the track.
 */
export function lengthSlide(traced: number, system: MeasurementSystem): LengthSlide {
  const step = system === 'imperial' ? STEP_IN : STEP_M;
  const onStep = (metres: number) => Math.round(metres / step) * step;
  return {
    min: Math.max(LENGTH_MIN_M, onStep(traced * (1 - LENGTH_SLIDE_SHARE))),
    max: Math.max(LENGTH_MIN_M, onStep(traced * (1 + LENGTH_SLIDE_SHARE))),
    step,
    mark: traced,
  };
}
const CENTIMETRE_DIGITS = 2;

/** A plain number as typed: digits and at most one point. Nothing else is a number here. */
const PLAIN = /^(?:\d+(?:\.\d*)?|\.\d+)$/;
/** Feet and inches in the feet box: 40'6", 40′ 6″, 40 ft 6 in, or 40' alone. */
const FEET_INCHES = /^(\d+(?:\.\d+)?)\s*(?:'|′|ft)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|″|in)?)?$/i;
/** A length and a width in one box: 13.2x8.6 — x, X, × or *, with spaces or m around. */
const PAIR = /^\s*((?:\d+(?:\.\d*)?|\.\d+))\s*m?\s*[xX×*]\s*((?:\d+(?:\.\d*)?|\.\d+))\s*m?\s*$/;

/** A pair on its way: digits, a point, a separator, as far as they are typed (`13.2x`). */
const PAIR_ON_ITS_WAY =
  /^\s*(?:\d+(?:\.\d*)?|\.\d*)?\s*m?\s*(?:[xX×*]\s*(?:\d+(?:\.\d*)?|\.\d*)?\s*)?$/;

/** Devanagari digits, as a Hindi or Marathi keyboard types them. */
const DEVANAGARI_ZERO = 0x0966;
const DEVANAGARI_DIGIT = /[\u0966-\u096F]/g;
/** A decimal comma: one or two digits after it. Three would group thousands, which no length has. */
const DECIMAL_COMMA = /(\d),(\d{1,2})(?!\d)/g;
const INCHES_IN_A_FOOT = 12;

/** What was typed, as the readers below take it: Western digits, and a point for a decimal comma. */
function asTyped(text: string): string {
  return text
    .replace(DEVANAGARI_DIGIT, (digit) =>
      String((digit.codePointAt(0) ?? DEVANAGARI_ZERO) - DEVANAGARI_ZERO),
    )
    .replace(DECIMAL_COMMA, '$1.$2');
}

/** Whether one box's text is still on its way to a pair: it waits, never refused, as it is typed. */
export function pairOnItsWay(text: string): boolean {
  return pairOf(text) === null && PAIR_ON_ITS_WAY.test(asTyped(text));
}

function plain(text: string): number | null {
  return PLAIN.test(text) ? Number(text) : null;
}

/** Inches beside feet: a plain number under a foot. */
function inchesOf(text: string): number | null {
  const inches = plain(text);
  return inches !== null && inches < INCHES_IN_A_FOOT ? inches : null;
}

/**
 * What a box holds: nothing yet, a length in metres, or something that is not a length — letters,
 * a second point, `1e3` — which is refused with its reason, never read as part of a number.
 */
export type EntryRead =
  | { readonly kind: 'empty' }
  | { readonly kind: 'bad' }
  | { readonly kind: 'metres'; readonly metres: number };

/**
 * Feet and inches typed together in the feet box: the inch box is not read beside them, for it may
 * still hold inches written there for the person. Inches take whole feet, under a foot.
 */
function feetBoxRead(feetText: string, inchesText: string | undefined): EntryRead {
  if (inchesText === undefined) {
    return { kind: 'metres', metres: metresOfFeetAndInches(Number(feetText), 0) };
  }
  const inches = inchesOf(inchesText);
  if (inches === null || feetText.includes('.')) return { kind: 'bad' };
  return { kind: 'metres', metres: metresOfFeetAndInches(Number(feetText), inches) };
}

export function entryRead(entry: LengthEntry, system: MeasurementSystem): EntryRead {
  const main = asTyped(entry.main.trim());
  if (system === 'metric') {
    if (main === '') return { kind: 'empty' };
    const metres = plain(main);
    return metres === null ? { kind: 'bad' } : { kind: 'metres', metres };
  }
  const inchesText = asTyped(entry.inches.trim());
  if (main === '' && inchesText === '') return { kind: 'empty' };
  const both = FEET_INCHES.exec(main);
  if (both !== null) return feetBoxRead(both[1] as string, both[2]);
  const feet = main === '' ? 0 : plain(main);
  const inches = inchesText === '' ? 0 : inchesOf(inchesText);
  // Inches take whole feet: a part of a foot beside inches says the length twice.
  if (feet === null || inches === null || (inchesText !== '' && main.includes('.'))) {
    return { kind: 'bad' };
  }
  return { kind: 'metres', metres: metresOfFeetAndInches(feet, inches) };
}

/** The metres a box holds, or `null` while it holds no length. */
export function entryMetres(entry: LengthEntry, system: MeasurementSystem): number | null {
  const read = entryRead(entry, system);
  return read.kind === 'metres' ? read.metres : null;
}

/**
 * A length and a width typed in one box, in metres (`13.2x8.6`): the two numbers as their own
 * boxes would hold them; `null` when the box is not two numbers.
 */
export function pairOf(text: string): readonly [string, string] | null {
  const pair = PAIR.exec(asTyped(text));
  return pair === null ? null : [pair[1] as string, pair[2] as string];
}

/** A length as the box shows it: metres to the centimetre, or whole feet and inches. */
export function entryOf(metres: number, system: MeasurementSystem, measured: boolean): LengthEntry {
  if (system === 'imperial') {
    const { feet, inches } = feetAndInches(metres);
    return { main: String(feet), inches: String(inches), measured };
  }
  return { main: metres.toFixed(CENTIMETRE_DIGITS), inches: '', measured };
}

/** The edge's length as the design stood when the box opened. */
export function tracedLength(document: StudioDocument, roof: number, edge: number): number {
  return edgeLengths(document.roofs[roof]?.corners ?? [])[edge] ?? 0;
}

/**
 * The length in the box, in metres; `null` while it holds no number. While the box still reads
 * the edge's own length, its rounding to the centimetre or the inch is not a change: the edge
 * keeps its exact length — in either unit, so m or ft alone moves nothing.
 */
export function handMetres(hand: LengthInHand, system: MeasurementSystem): number | null {
  const typed = entryMetres(hand.entry, system);
  if (typed === null) return null;
  const traced = tracedLength(hand.base, hand.roof, hand.edge);
  return entryMetres(entryOf(traced, system, hand.entry.measured), system) === typed
    ? traced
    : typed;
}

/** The box still reads the edge as it stood: its own length, its own measured or not. */
export function handUntouched(hand: LengthInHand, system: MeasurementSystem): boolean {
  const measured = hand.base.roofs[hand.roof]?.edges[hand.edge] === 'measured';
  return (
    hand.entry.measured === measured &&
    handMetres(hand, system) === tracedLength(hand.base, hand.roof, hand.edge)
  );
}

/** Whether the length in the box sizes the plan its roof was made from, not the picture. */
export function lengthSizesPlan(hand: LengthInHand): boolean {
  return hand.planRoofs?.includes(hand.roof) ?? false;
}

/** What the length in the box would make of the design, or why it cannot; empty: no number yet. */
export function sizingResult(
  hand: LengthInHand,
  system: MeasurementSystem,
): { readonly kind: 'empty' } | EditResult {
  const metres = handMetres(hand, system);
  if (metres === null) return { kind: 'empty' };
  const trust: SetEdgeTrust = hand.entry.measured ? 'measured' : 'typed';
  if (lengthSizesPlan(hand)) {
    return planSizedByLength(hand.base, hand.planRoofs ?? [], hand.roof, hand.edge, metres, trust);
  }
  return lengthSet(hand.base, hand.roof, hand.edge, metres, trust);
}

/** The box one step − or + on; `null` when the step would reach nothing. */
export function steppedEntry(
  hand: LengthInHand,
  by: 1 | -1,
  system: MeasurementSystem,
): LengthEntry | null {
  const now = handMetres(hand, system) ?? tracedLength(hand.base, hand.roof, hand.edge);
  const metres = now + by * (system === 'imperial' ? STEP_IN : STEP_M);
  return metres > 0 ? entryOf(metres, system, hand.entry.measured) : null;
}

/** Whether one step − or + would be refused: the button dims. */
export function stepRefused(hand: LengthInHand, by: 1 | -1, system: MeasurementSystem): boolean {
  const next = steppedEntry(hand, by, system);
  return next === null || sizingResult({ ...hand, entry: next }, system).kind !== 'done';
}
