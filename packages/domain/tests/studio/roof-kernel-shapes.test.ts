import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { riseForSlope, roofFormed, slopeForRise } from '../../src/studio/roof-forms';
import {
  joined,
  metWith,
  ringAreaM2,
  shapeOf,
  shapesArea,
  shared,
  stretchesTaken,
  without,
} from '../../src/studio/roof-polygons';
import { C_ROOF, expectCovers, L_ROOF, p, RECT } from './roof-kernel-support';

/**
 * The rest of the geometry kernel (`T-M05-002`, part e): strip roofs, roofs joined and cut out of
 * each other, and edges that meet within 0.3 m.
 */
const SLOPE = 30;
const RISE = Math.tan((SLOPE * Math.PI) / 180);
const box = (west: number, south: number, wide: number, deep: number): GroundPoint[] => [
  p(west, south),
  p(west + wide, south),
  p(west + wide, south + deep),
  p(west, south + deep),
];
const kindsOf = (roof: { faces: readonly { edges: readonly string[] }[] }) =>
  new Set(roof.faces.flatMap((face) => face.edges));
const tops = (roof: { faces: readonly { corners: readonly { up: number }[] }[] }) =>
  roof.faces.map((face) => Math.max(...face.corners.map((corner) => corner.up)));

describe('strip roofs: the height changes one way across the roof', () => {
  it('a shed: one face, rising from its low side to the far edge', () => {
    const roof = roofFormed(RECT, { shape: 'shed', slopeDeg: SLOPE, side: 0 });
    expect(roof.built).toBe('shed');
    expect(roof.faces).toHaveLength(1);
    expect(roof.topM).toBeCloseTo(6 * RISE, 6);
    expect(roof.faces[0]?.edges).toEqual(['eave', 'gable_end', 'ridge', 'gable_end']);
    // It slopes down to the south, across its low side.
    expect(roof.faces[0]?.downDeg).toBeCloseTo(180, 6);
    expect(roof.faces[0]?.surfaceM2).toBeCloseTo(60 / Math.cos((SLOPE * Math.PI) / 180), 6);
  });

  it.each([
    [0, 180, 6],
    [1, 90, 10],
    [2, 0, 6],
    [3, 270, 10],
  ])('a shed whose low side is side %s slopes down to %s°, over %s m', (side, downDeg, across) => {
    const roof = roofFormed(RECT, { shape: 'shed', slopeDeg: SLOPE, side });
    expect(roof.faces[0]?.downDeg).toBeCloseTo(downDeg, 6);
    expect(roof.topM).toBeCloseTo(across * RISE, 6);
  });

  it('a shed on an L covers it, one plane over both wings', () => {
    const roof = roofFormed(L_ROOF, { shape: 'shed', slopeDeg: 10, side: 0 });
    expectCovers(roof, ringAreaM2(L_ROOF));
    expect(new Set(roof.faces.map((face) => face.slopeDeg.toFixed(6))).size).toBe(1);
  });

  it('a butterfly: two faces down to a valley, where it is put', () => {
    const roof = roofFormed(RECT, { shape: 'butterfly', slopeDeg: SLOPE, side: 0, valleyAt: 0.25 });
    expect(roof.faces).toHaveLength(2);
    expect(kindsOf(roof)).toEqual(new Set(['ridge', 'valley', 'gable_end']));
    expect(tops(roof).sort((a, b) => a - b)[0]).toBeCloseTo(1.5 * RISE, 6);
    expect(roof.topM).toBeCloseTo(4.5 * RISE, 6);
    expectCovers(roof, 60);
  });

  it.each([
    [1, 1],
    [3, 3],
    [6, 6],
  ])('a sawtooth of %s teeth: %s faces, each running down from its glass', (teeth, faces) => {
    const roof = roofFormed(RECT, { shape: 'sawtooth', slopeDeg: SLOPE, side: 0, teeth });
    expect(roof.faces).toHaveLength(faces);
    expect(roof.topM).toBeCloseTo((6 / teeth) * RISE, 6);
    // The glass stands at the start of every tooth but the first, which the outline's own wall holds.
    expect(roof.walls).toHaveLength(teeth - 1);
    for (const wall of roof.walls) {
      expect(wall.lowM).toBeCloseTo(0, 6);
      expect(wall.highM).toBeCloseTo((6 / teeth) * RISE, 6);
    }
    // Every solid face looks away from the glass side: down to the north here.
    expect(roof.faces.every((face) => Math.abs(face.downDeg) < 1e-6)).toBe(true);
    expectCovers(roof, 60);
  });

  it('a monitor: a gable whose middle is lifted, with a wall each side of it', () => {
    const roof = roofFormed(RECT, {
      shape: 'monitor',
      slopeDeg: SLOPE,
      side: 0,
      raisedWidthM: 2,
      raisedHeightM: 1,
    });
    expect(roof.faces).toHaveLength(4);
    expect(roof.walls).toHaveLength(2);
    expect(roof.topM).toBeCloseTo(3 * RISE + 1, 6);
    for (const wall of roof.walls) expect(wall.highM - wall.lowM).toBeCloseTo(1, 6);
    expectCovers(roof, 60);
  });

  it.each([
    [3, 4],
    [6, 6],
    [12, 8],
  ])('a curved roof asked for in %s faces is built in %s', (asked, faces) => {
    const roof = roofFormed(RECT, { shape: 'curved', slopeDeg: SLOPE, side: 0, segments: asked });
    expect(roof.faces).toHaveLength(faces);
    expectCovers(roof, 60);
    // An arc: it rises from each eave to its middle, and is as high at one eave as at the other.
    const heights = roof.faces.flatMap((face) => face.corners.map((corner) => corner.up));
    expect(Math.min(...heights)).toBeCloseTo(0, 6);
    expect(roof.topM).toBeGreaterThan(0);
  });

  it('a shape that cannot stand on its outline falls back, and a roof is never refused', () => {
    // Every side a gable end leaves no face: the roof is built as a hip.
    const allEnds = [0, 1, 2, 3].map(() => ({ end: 'gable' as const }));
    expect(roofFormed(RECT, { shape: 'gable', slopeDeg: SLOPE, sides: allEnds }).built).toBe('hip');
    // A sliver with no width across cannot be cut into strips: it is flat.
    const sliver = [p(0, 0), p(10, 0), p(10, 0), p(0, 0)];
    expect(roofFormed(sliver, { shape: 'shed', slopeDeg: SLOPE, side: 0 }).built).toBe('flat');
  });

  it.each([
    [1.5, 3, 26.565],
    [0, 3, 0],
    [3, 3, 45],
  ])('a ridge %s m up over a run of %s m is a slope of %s°, and back', (rise, run, degrees) => {
    expect(slopeForRise(rise, run)).toBeCloseTo(degrees, 3);
    if (degrees > 1) expect(riseForSlope(degrees, run)).toBeCloseTo(rise, 3);
  });
});

describe('roofs as shapes: joined, cut and laid over each other', () => {
  const BAR = box(0, 6, 12, 5);
  const STEM = box(4, 0, 4, 6);

  it('a T drawn as two rectangles joins into one roof with one outline', () => {
    const one = joined([shapeOf(BAR)], [shapeOf(STEM)]);
    expect(one).toHaveLength(1);
    expect(one?.[0]?.outer).toHaveLength(8);
    expect(shapesArea(one ?? [])).toBeCloseTo(60 + 24, 6);
  });

  it('two roofs drawn 0.2 m apart are met first, then join with no sliver between', () => {
    const apart = box(4, -0.2, 4, 6).map((corner) => p(corner.east, corner.north - 0));
    const stem = [p(4, -0.2), p(8, -0.2), p(8, 5.8), p(4, 5.8)];
    expect(apart).toHaveLength(4);
    const met = metWith(stem, BAR);
    expect(met.slice(2)).toEqual([p(8, 6), p(4, 6)]);
    const one = joined([shapeOf(BAR)], [shapeOf(met)]);
    expect(one).toHaveLength(1);
    expect(one?.[0]?.holes).toHaveLength(0);
  });

  it.each([
    ['0.3 m off: met', 0.3, true],
    ['0.31 m off: its own place', 0.31, false],
  ])('a corner %s', (_why, gap, met) => {
    const moved = metWith([p(4, 6 - gap), p(8, 6 - gap), p(8, 0), p(4, 0)], BAR);
    expect(moved[0]?.north === 6).toBe(met);
  });

  it('a separate part is carved out of the roof round it', () => {
    const part = box(6, 0, 4, 6);
    const left = without([shapeOf(RECT)], [shapeOf(part)]);
    expect(shapesArea(left ?? [])).toBeCloseTo(60 - 24, 6);
    expect(left?.[0]?.outer).toHaveLength(4);
  });

  it('a hole inside a roof leaves a ring; the area leaves it out', () => {
    const left = without([shapeOf(RECT)], [shapeOf(box(4, 2, 2, 2))]);
    expect(left?.[0]?.holes).toHaveLength(1);
    expect(shapesArea(left ?? [])).toBeCloseTo(56, 6);
  });

  it('an upper floor across two roofs: how much of each it covers', () => {
    const west = box(0, 0, 6, 10);
    const east = box(8, 0, 6, 10);
    const upper = box(4, 2, 7, 4);
    expect(shapesArea(shared([shapeOf(upper)], [shapeOf(west)]) ?? [])).toBeCloseTo(8, 6);
    expect(shapesArea(shared([shapeOf(upper)], [shapeOf(east)]) ?? [])).toBeCloseTo(12, 6);
    // Every spot once, as seen from above: the three together.
    const all = joined(joined([shapeOf(west)], [shapeOf(east)]) ?? [], [shapeOf(upper)]);
    expect(shapesArea(all ?? [])).toBeCloseTo(60 + 60 + 28 - 20, 6);
  });

  it('a C roof with an upper floor on one arm: the edge splits exactly where the floor starts', () => {
    // The arm along the south, 10 × 3; the upper floor covers its east 6 m, flush with the outer walls.
    const upper = box(4, 0, 6, 3);
    const south = stretchesTaken(C_ROOF[0] as GroundPoint, C_ROOF[1] as GroundPoint, upper);
    expect(south).toHaveLength(1);
    expect(south[0]?.from).toBeCloseTo(0.4, 6);
    expect(south[0]?.to).toBeCloseTo(1, 6);
    // The arm's end is under the floor whole; the far side of the C is not touched.
    expect(stretchesTaken(C_ROOF[1] as GroundPoint, C_ROOF[2] as GroundPoint, upper)).toEqual([
      { from: 0, to: 1 },
    ]);
    expect(stretchesTaken(C_ROOF[7] as GroundPoint, C_ROOF[0] as GroundPoint, upper)).toEqual([]);
  });

  it('a floor drawn 0.2 m inside the wall still takes that stretch of the edge', () => {
    const loose = box(4, 0.2, 5.8, 2.8);
    const south = stretchesTaken(C_ROOF[0] as GroundPoint, C_ROOF[1] as GroundPoint, loose);
    expect(south).toHaveLength(1);
    expect(south[0]?.from).toBeCloseTo(0.4, 6);
  });

  it('two roofs side by side share the stretch where they meet, and no more', () => {
    const shed = box(10, 2, 4, 3);
    const east = stretchesTaken(RECT[1] as GroundPoint, RECT[2] as GroundPoint, shed);
    expect(east).toHaveLength(1);
    expect(east[0]?.from).toBeCloseTo(2 / 6, 6);
    expect(east[0]?.to).toBeCloseTo(5 / 6, 6);
  });
});
