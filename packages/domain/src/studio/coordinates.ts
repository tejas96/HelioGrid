import type { Coordinate } from '../format/areas';

/**
 * Coordinates as a person gives them: two numbers typed in two fields, or one pasted pair
 * (`16.8367, 74.5966`). Decimal degrees, WGS 84 — the same point a phone's map app copies.
 */

/** Why a typed pair is not a place. */
export const COORDINATE_FAULTS = ['incomplete', 'not_numbers', 'out_of_range'] as const;
export type CoordinateFault = (typeof COORDINATE_FAULTS)[number];

export type CoordinateRead =
  | { readonly kind: 'empty' }
  | { readonly kind: 'point'; readonly point: Coordinate }
  | { readonly kind: 'fault'; readonly fault: CoordinateFault };

const NUMBER = /^-?\d+(?:\.\d+)?$/;
const PAIR = /^\s*(-?\d+(?:\.\d+)?)\s*(?:,|\s)\s*(-?\d+(?:\.\d+)?)\s*$/;
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;

/** A stored pin keeps six decimals, about 0.1 m — finer than any picture a roof is pinned on. */
const PIN_STORED_DECIMALS = 6;
const PIN_SCALE = 10 ** PIN_STORED_DECIMALS;
/** A pin is shown to five decimals, about 1 m. */
const PIN_SHOWN_DECIMALS = 5;

function inRange(point: Coordinate): boolean {
  return Math.abs(point.latitude) <= LATITUDE_MAX && Math.abs(point.longitude) <= LONGITUDE_MAX;
}

/** The pin as it is stored: rounded once, so the value saved is the value read back. */
export function roundPin(point: Coordinate): Coordinate {
  return {
    latitude: Math.round(point.latitude * PIN_SCALE) / PIN_SCALE,
    longitude: Math.round(point.longitude * PIN_SCALE) / PIN_SCALE,
  };
}

/** The two fields read together: both empty is no answer yet, one empty is half an answer. */
export function readCoordinates(latitude: string, longitude: string): CoordinateRead {
  const lat = latitude.trim();
  const lng = longitude.trim();
  if (lat === '' && lng === '') return { kind: 'empty' };
  if (lat === '' || lng === '') return { kind: 'fault', fault: 'incomplete' };
  if (!NUMBER.test(lat) || !NUMBER.test(lng)) return { kind: 'fault', fault: 'not_numbers' };
  const point = { latitude: Number(lat), longitude: Number(lng) };
  return inRange(point)
    ? { kind: 'point', point: roundPin(point) }
    : { kind: 'fault', fault: 'out_of_range' };
}

/**
 * A pasted text that is one pair of coordinates, or `null` when it is anything else — an address
 * with a number in it is still an address, so only a text that is nothing but the pair counts.
 */
export function readCoordinatePair(text: string): Coordinate | null {
  const [, latitude, longitude] = PAIR.exec(text) ?? [];
  if (latitude === undefined || longitude === undefined) return null;
  const read = readCoordinates(latitude, longitude);
  return read.kind === 'point' ? read.point : null;
}

/** The pin as it is stored and recorded, to its six decimals: two pins are one where this is equal. */
export function pinRecordText(point: Coordinate): string {
  const stored = roundPin(point);
  return `${stored.latitude.toFixed(PIN_STORED_DECIMALS)}, ${stored.longitude.toFixed(PIN_STORED_DECIMALS)}`;
}

/** One half of a pin as its field shows it. A coordinate is a code, never a localised number. */
export function pinPartText(degrees: number): string {
  return degrees.toFixed(PIN_SHOWN_DECIMALS);
}

/** The pin as one line under the map: `16.83670, 74.59660`. */
export function pinText(point: Coordinate): string {
  return `${pinPartText(point.latitude)}, ${pinPartText(point.longitude)}`;
}
