import { feetAndInches, metresOfFeetAndInches } from '../format/measurement';
import { parseNumber } from '../format/number';
import type { MeasurementSystem } from '../format/pack';
import type { SetEdgeTrust, StudioDocument } from './document';
import type { EditResult } from './roof-check';
import { lengthSet } from './roof-length';
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
}

const STEP_M = 0.05;
const STEP_IN = 0.0254;
const CENTIMETRE_DIGITS = 2;

/** The metres a box holds, or `null` while it holds no number. */
export function entryMetres(entry: LengthEntry, system: MeasurementSystem): number | null {
  const main = entry.main.trim();
  if (system === 'metric') {
    const metres = main === '' ? null : parseNumber(main);
    return metres === null || !Number.isFinite(metres) ? null : metres;
  }
  const inchesText = entry.inches.trim();
  if (main === '' && inchesText === '') return null;
  const feet = main === '' ? 0 : parseNumber(main);
  const inches = inchesText === '' ? 0 : parseNumber(inchesText);
  return feet === null || inches === null ? null : metresOfFeetAndInches(feet, inches);
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

/** What the length in the box would make of the design, or why it cannot; empty: no number yet. */
export function sizingResult(
  hand: LengthInHand,
  system: MeasurementSystem,
): { readonly kind: 'empty' } | EditResult {
  const metres = entryMetres(hand.entry, system);
  if (metres === null) return { kind: 'empty' };
  const trust: SetEdgeTrust = hand.entry.measured ? 'measured' : 'typed';
  return lengthSet(hand.base, hand.roof, hand.edge, metres, trust);
}

/** The box one step − or + on; `null` when the step would reach nothing. */
export function steppedEntry(
  hand: LengthInHand,
  by: 1 | -1,
  system: MeasurementSystem,
): LengthEntry | null {
  const now = entryMetres(hand.entry, system) ?? tracedLength(hand.base, hand.roof, hand.edge);
  const metres = now + by * (system === 'imperial' ? STEP_IN : STEP_M);
  return metres > 0 ? entryOf(metres, system, hand.entry.measured) : null;
}

/** Whether one step − or + would be refused: the button dims. */
export function stepRefused(hand: LengthInHand, by: 1 | -1, system: MeasurementSystem): boolean {
  const next = steppedEntry(hand, by, system);
  return next === null || sizingResult({ ...hand, entry: next }, system).kind !== 'done';
}
