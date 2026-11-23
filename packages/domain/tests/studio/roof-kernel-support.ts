import { expect } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import type { BuiltFace, BuiltRoof } from '../../src/studio/roof-faces';
import { ringAreaM2, shapeOf, shapesArea, shared } from '../../src/studio/roof-polygons';

/** The kernel's tests: outlines real roofs have, and what must hold of the faces built on any. */

export const p = (east: number, north: number): GroundPoint => ({ east, north });

/** A 10 × 6 m rectangle, a 6 m square, and the wings real houses are made of. */
export const RECT = [p(0, 0), p(10, 0), p(10, 6), p(0, 6)];
export const SQUARE = [p(0, 0), p(6, 0), p(6, 6), p(0, 6)];
export const L_ROOF = [p(0, 0), p(10, 0), p(10, 4), p(4, 4), p(4, 10), p(0, 10)];
/** A main bar 12 × 5 with a 4 m wide stem 6 m long under its middle. */
export const T_ROOF = [p(0, 6), p(4, 6), p(4, 0), p(8, 0), p(8, 6), p(12, 6), p(12, 11), p(0, 11)];
export const U_ROOF = [p(0, 0), p(4, 0), p(4, 6), p(8, 6), p(8, 0), p(12, 0), p(12, 10), p(0, 10)];
export const C_ROOF = [
  p(0, 0),
  p(10, 0),
  p(10, 3),
  p(3, 3),
  p(3, 9),
  p(10, 9),
  p(10, 12),
  p(0, 12),
];
/** A chevron: one corner points deep into the roof, on no right angle. */
export const INWARD = [p(0, 0), p(6, 3), p(12, 0), p(12, 8), p(0, 8)];
export const COURT = {
  outer: [p(0, 0), p(14, 0), p(14, 12), p(0, 12)],
  hole: [p(5, 4), p(9, 4), p(9, 8), p(5, 8)],
};

export const NAMED: readonly (readonly [string, readonly GroundPoint[]])[] = [
  ['a rectangle', RECT],
  ['a square', SQUARE],
  ['an L', L_ROOF],
  ['a T', T_ROOF],
  ['a U', U_ROOF],
  ['a C', C_ROOF],
  ['a corner that points inward', INWARD],
];

/** Heights and areas agree to a tenth of a millimetre. */
const CLOSE = 4;

/** The faces cover the outline exactly: their areas add up to it, and no two lie over each other. */
export function expectCovers(roof: BuiltRoof, areaM2: number): void {
  const sum = roof.faces.reduce((total, face) => total + face.areaM2, 0);
  expect(sum).toBeCloseTo(areaM2, CLOSE);
  roof.faces.forEach((face, i) => {
    expect(face.areaM2).toBeCloseTo(ringAreaM2(face.corners), CLOSE);
    for (const other of roof.faces.slice(i + 1)) {
      const over = shared([shapeOf(face.corners)], [shapeOf(other.corners)]);
      expect(shapesArea(over ?? [])).toBeLessThan(1e-6);
    }
  });
}

/** Neighbouring faces meet at one height: a place two faces share has one height. */
export function expectOneHeight(roof: BuiltRoof): void {
  const heights = new Map<string, number>();
  for (const face of roof.faces) {
    for (const corner of face.corners) {
      const key = `${corner.east.toFixed(5)},${corner.north.toFixed(5)}`;
      const seen = heights.get(key);
      if (seen !== undefined) expect(corner.up).toBeCloseTo(seen, CLOSE);
      heights.set(key, corner.up);
    }
  }
}

/**
 * Each face is flat and slopes square to its eave: every corner stands at the eave's height plus
 * the slope's rise over its distance in from the eave's line.
 */
export function expectSquareToEave(
  face: BuiltFace,
  corners: readonly GroundPoint[],
  eaveM = 0,
): void {
  const from = corners[face.side] as GroundPoint;
  const to = corners[(face.side + 1) % corners.length] as GroundPoint;
  const length = Math.hypot(to.east - from.east, to.north - from.north);
  const rise = Math.tan((face.slopeDeg * Math.PI) / 180);
  for (const corner of face.corners) {
    const cross =
      (to.east - from.east) * (corner.north - from.north) -
      (to.north - from.north) * (corner.east - from.east);
    expect(corner.up).toBeCloseTo(eaveM + (rise * Math.abs(cross)) / length, CLOSE);
  }
}

/** A small seeded generator, so a random outline is the same on every run. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A right-angled outline: a row of blocks of random widths standing on one line, each of its own
 * depth — a skyline. Every corner is square, and many point inward.
 */
export function skyline(seed: number, blocks: number): GroundPoint[] {
  const next = seeded(seed);
  const top: GroundPoint[] = [];
  let east = 0;
  let before = -1;
  for (let i = 0; i < blocks; i++) {
    const wide = 2 + Math.floor(next() * 5);
    let deep = 3 + Math.floor(next() * 7);
    if (deep === before) deep += 1;
    top.push(p(east, deep), p(east + wide, deep));
    east += wide;
    before = deep;
  }
  // Anticlockwise: along the foot, then back over the tops.
  return [p(0, 0), p(east, 0), ...top.reverse()];
}
