import type { MeasurementSystem } from '../format/pack';
import { GROUND_REACH_M, ROOFS_MAX, type Roof, type StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { entryOf, entryRead, type LengthEntry, pairOf, pairOnItsWay } from './roof-entry';
import { LENGTH_MAX_M, LENGTH_MIN_M } from './roof-length';
import { roofsOverlap } from './roof-shape';

/**
 * Type the size (`T-M05-002`, part c): a rectangle from two numbers, with no picture to trace. The
 * place is fixed when the card opens — on the pin, or beside the roof there — and the rectangle
 * grows from it as the numbers change, never jumping sides. Its length runs east–west as typed.
 * Any other shape is this rectangle reshaped with part b's tools.
 */

/** The sliders' ends, in metres: a shed to a large house. A size past them is typed. */
export const TYPED_SLIDE_MIN_M = 1;
export const TYPED_SLIDE_MAX_M = 40;

/** Which side of a roof a typed roof goes, in the order tried. */
export const TYPED_SIDES = ['east', 'south', 'west', 'north'] as const;
export type TypedSide = (typeof TYPED_SIDES)[number];

/** Where the typed rectangle grows from: centred on the pin, or against one side of a roof. */
export type TypedPlace =
  | { readonly kind: 'pin' }
  | { readonly kind: 'beside'; readonly roof: number; readonly side: TypedSide };

/** Why the rectangle cannot be placed. `roof`: the roof it would run into. */
export type TypedRefusal =
  | { readonly kind: 'not_a_number' }
  | { readonly kind: 'too_short' }
  | { readonly kind: 'too_long' }
  | { readonly kind: 'overlaps'; readonly roof: number }
  | { readonly kind: 'too_far' }
  | { readonly kind: 'too_many_roofs' };

/** The two numbers in the card, as typed or slid, and the one-box text on a desktop. */
export interface TypedSize {
  readonly length: LengthEntry;
  readonly width: LengthEntry;
  /** The desktop's one box (`13.2x8.6`) as typed; `null` when the two boxes or sliders hold it. */
  readonly pair: string | null;
  readonly place: TypedPlace;
  /**
   * The boxes as they were before the last change of units, and what that change wrote: units
   * changed back with nothing typed between give back what was typed, never a length rounded twice.
   */
  readonly back?: {
    readonly system: MeasurementSystem;
    readonly shown: { readonly length: LengthEntry; readonly width: LengthEntry };
    readonly was: {
      readonly length: LengthEntry;
      readonly width: LengthEntry;
      readonly pair: string | null;
    };
  };
}

interface Box {
  readonly minE: number;
  readonly maxE: number;
  readonly minN: number;
  readonly maxN: number;
}

function boxOf(corners: readonly GroundPoint[]): Box {
  const easts = corners.map((c) => c.east);
  const norths = corners.map((c) => c.north);
  return {
    minE: Math.min(...easts),
    maxE: Math.max(...easts),
    minN: Math.min(...norths),
    maxN: Math.max(...norths),
  };
}

/** A rectangle from its south-west corner, anticlockwise: the length east, the width north. */
function rectangle(west: number, south: number, length: number, width: number): GroundPoint[] {
  return [
    { east: west, north: south },
    { east: west + length, north: south },
    { east: west + length, north: south + width },
    { east: west, north: south + width },
  ];
}

/** The rectangle's corners at its place, `length` east–west and `width` north–south. */
export function typedCorners(
  place: TypedPlace,
  roofs: readonly Roof[],
  length: number,
  width: number,
): GroundPoint[] {
  const against = place.kind === 'beside' ? roofs[place.roof] : undefined;
  if (place.kind === 'pin' || against === undefined) {
    return rectangle(-length / 2, -width / 2, length, width);
  }
  const box = boxOf(against.corners);
  const midE = (box.minE + box.maxE) / 2;
  const midN = (box.minN + box.maxN) / 2;
  switch (place.side) {
    case 'east':
      return rectangle(box.maxE, midN - width / 2, length, width);
    case 'west':
      return rectangle(box.minE - length, midN - width / 2, length, width);
    case 'south':
      return rectangle(midE - length / 2, box.minN - width, length, width);
    default:
      return rectangle(midE - length / 2, box.maxN, length, width);
  }
}

function clear(corners: readonly GroundPoint[], roofs: readonly Roof[]): boolean {
  return !roofs.some((roof) => roofsOverlap(corners, roof.corners));
}

/**
 * Where a typed roof of the start size goes, fixed when the card opens: on the pin when it fits
 * there; else beside the roof in the way, on its first side where it fits (east first).
 */
export function typedPlaceOf(roofs: readonly Roof[], length: number, width: number): TypedPlace {
  const pin: TypedPlace = { kind: 'pin' };
  const atPin = typedCorners(pin, roofs, length, width);
  const inWay = roofs.findIndex((roof) => roofsOverlap(atPin, roof.corners));
  if (inWay === -1) return pin;
  for (const side of TYPED_SIDES) {
    const place: TypedPlace = { kind: 'beside', roof: inWay, side };
    if (clear(typedCorners(place, roofs, length, width), roofs)) return place;
  }
  return { kind: 'beside', roof: inWay, side: 'east' };
}

/** The card as it opens: the market's start size, at its place. */
export function typedStart(
  roofs: readonly Roof[],
  start: { readonly length: number; readonly width: number },
  system: MeasurementSystem,
): TypedSize {
  return {
    length: entryOf(start.length, system, false),
    width: entryOf(start.width, system, false),
    pair: null,
    place: typedPlaceOf(roofs, start.length, start.width),
  };
}

/** The desktop's one box typed: its two numbers fill the two boxes, or wait as typed. */
export function typedPair(size: TypedSize, text: string): TypedSize {
  const pair = pairOf(text);
  if (pair === null) return { ...size, pair: text };
  return {
    ...size,
    pair: text,
    length: { main: pair[0], inches: '', measured: false },
    width: { main: pair[1], inches: '', measured: false },
  };
}

export type TypedResult =
  | { readonly kind: 'empty' }
  | { readonly kind: 'refused'; readonly refusal: TypedRefusal }
  | {
      readonly kind: 'ready';
      readonly corners: readonly GroundPoint[];
      readonly length: number;
      readonly width: number;
    };

function boundsRefusal(metres: number): TypedRefusal | null {
  if (metres < LENGTH_MIN_M) return { kind: 'too_short' };
  return metres > LENGTH_MAX_M ? { kind: 'too_long' } : null;
}

/** What the card would place now, or why it cannot; empty while a box holds nothing. */
export function typedResult(
  size: TypedSize,
  document: StudioDocument,
  system: MeasurementSystem,
): TypedResult {
  // The desktop's one box: empty or half typed it waits; text that can never be a pair is refused.
  if (size.pair !== null && pairOf(size.pair) === null) {
    return pairOnItsWay(size.pair)
      ? { kind: 'empty' }
      : { kind: 'refused', refusal: { kind: 'not_a_number' } };
  }
  const length = entryRead(size.length, system);
  const width = entryRead(size.width, system);
  if (length.kind === 'bad' || width.kind === 'bad') {
    return { kind: 'refused', refusal: { kind: 'not_a_number' } };
  }
  if (length.kind === 'empty' || width.kind === 'empty') return { kind: 'empty' };
  const bounds = boundsRefusal(length.metres) ?? boundsRefusal(width.metres);
  if (bounds !== null) return { kind: 'refused', refusal: bounds };
  if (document.roofs.length >= ROOFS_MAX) {
    return { kind: 'refused', refusal: { kind: 'too_many_roofs' } };
  }
  const corners = typedCorners(size.place, document.roofs, length.metres, width.metres);
  if (
    corners.some((c) => Math.abs(c.east) > GROUND_REACH_M || Math.abs(c.north) > GROUND_REACH_M)
  ) {
    return { kind: 'refused', refusal: { kind: 'too_far' } };
  }
  const inWay = document.roofs.findIndex((roof) => roofsOverlap(corners, roof.corners));
  if (inWay !== -1) return { kind: 'refused', refusal: { kind: 'overlaps', roof: inWay } };
  return { kind: 'ready', corners, length: length.metres, width: width.metres };
}

/**
 * The roof a ready card places: every edge typed by a person, traced on no picture — its lengths
 * are true, so a picture never stretches it.
 */
export function typedRoof(corners: readonly GroundPoint[], id: string): Roof {
  return { id, corners, edges: corners.map(() => 'typed'), tracedOn: 'none', height: null };
}

/** The card's numbers in another unit: each box holds the same length, written in it. */
export function typedInUnits(
  size: TypedSize,
  from: MeasurementSystem,
  to: MeasurementSystem,
): TypedSize {
  const { back } = size;
  const same = (a: LengthEntry, b: LengthEntry) =>
    a.main === b.main && a.inches === b.inches && a.measured === b.measured;
  if (
    back !== undefined &&
    back.system === to &&
    same(back.shown.length, size.length) &&
    same(back.shown.width, size.width)
  ) {
    const { back: _gone, ...rest } = size;
    return { ...rest, ...back.was };
  }
  const convert = (entry: LengthEntry): LengthEntry => {
    const read = entryRead(entry, from);
    return read.kind === 'metres' ? entryOf(read.metres, to, false) : entry;
  };
  const length = convert(size.length);
  const width = convert(size.width);
  return {
    ...size,
    length,
    width,
    pair: null,
    back: {
      system: from,
      shown: { length, width },
      was: { length: size.length, width: size.width, pair: size.pair },
    },
  };
}

/** What the studio knows as a design opens, for the size card to open by itself or not. */
export interface SizeCardArrival {
  /** The design's document is read; `roofs` counts its roofs. */
  readonly loaded: boolean;
  readonly roofs: number;
  /** The sky picture answered — a picture, or none — and is not still on its way. */
  readonly pictureAnswered: boolean;
  readonly noPicture: boolean;
  /** Who may edit is settled: the edit turn is taken or refused. */
  readonly editingSettled: boolean;
  readonly editable: boolean;
  readonly top: boolean;
}

/**
 * Whether the size card opens by itself as the design opens (`T-M05-002c`): `wait` while the
 * document, the picture or the edit turn is still on its way; then, once, `open` — no picture, no
 * roof, an editor, the top view — or `never`. A later pick of No picture, or a last roof deleted,
 * never opens it.
 */
export function sizeCardOnArrival(arrival: SizeCardArrival): 'wait' | 'open' | 'never' {
  if (!arrival.loaded || !arrival.pictureAnswered || !arrival.editingSettled) return 'wait';
  const opens = arrival.noPicture && arrival.roofs === 0 && arrival.editable && arrival.top;
  return opens ? 'open' : 'never';
}
