import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { facesFromSides, type SideShape } from '../../src/studio/roof-faces';
import { gableEnds, roofFormed } from '../../src/studio/roof-forms';
import { ringAreaM2 } from '../../src/studio/roof-polygons';
import {
  C_ROOF,
  COURT,
  expectCovers,
  expectOneHeight,
  expectSquareToEave,
  INWARD,
  L_ROOF,
  NAMED,
  p,
  RECT,
  SQUARE,
  skyline,
  T_ROOF,
  U_ROOF,
} from './roof-kernel-support';

/**
 * The geometry kernel's faces (`T-M05-002`, part e), proven on real outlines before any screen
 * uses it: the faces cover the outline with no gap, each is flat and slopes square to its eave,
 * neighbours meet at one height, every edge knows what it is, and known answers hold.
 */
const SLOPE = 30;
const RISE = Math.tan((SLOPE * Math.PI) / 180);
const eaves = (corners: readonly GroundPoint[], slopeDeg = SLOPE): SideShape[] =>
  corners.map(() => ({ gable: false, slopeDeg, eaveM: 0 }));
const built = (corners: readonly GroundPoint[], sides = eaves(corners)) => {
  const roof = facesFromSides({ corners, sides });
  if (roof === null) throw new Error('the faces could not be built');
  return roof;
};
const kindsOf = (roof: { faces: readonly { edges: readonly string[] }[] }) =>
  new Set(roof.faces.flatMap((face) => face.edges));
/** The length of every edge of a kind, each edge counted once though two faces share it. */
const lengthOf = (roof: ReturnType<typeof built>, kind: string) => {
  let total = 0;
  for (const face of roof.faces) {
    face.corners.forEach((corner, i) => {
      const next = face.corners[(i + 1) % face.corners.length] as (typeof face.corners)[number];
      if (face.edges[i] === kind)
        total += Math.hypot(next.east - corner.east, next.north - corner.north);
    });
  }
  return total / 2;
};

describe('a hip roof on any outline', () => {
  it.each(NAMED)(
    'on %s: the faces cover it, each square to its eave, meeting at one height',
    (_name, corners) => {
      const roof = built(corners);
      expectCovers(roof, ringAreaM2(corners));
      expectOneHeight(roof);
      for (const face of roof.faces) expectSquareToEave(face, corners);
      expect(roof.faces.every((face) => face.edges.includes('eave'))).toBe(true);
    },
  );

  it('a hip’s ridge is the long side less the short side, at half the short side’s rise', () => {
    const roof = built(RECT);
    expect(roof.faces).toHaveLength(4);
    expect(lengthOf(roof, 'ridge')).toBeCloseTo(10 - 6, 6);
    expect(roof.topM).toBeCloseTo(3 * RISE, 6);
    expect(kindsOf(roof)).toEqual(new Set(['eave', 'hip', 'ridge']));
  });

  it('a square is a pyramid: four faces to one point, and no ridge', () => {
    const roof = built(SQUARE);
    expect(roof.faces.map((face) => face.corners.length)).toEqual([3, 3, 3, 3]);
    expect(lengthOf(roof, 'ridge')).toBe(0);
    expect(roof.topM).toBeCloseTo(3 * RISE, 6);
  });

  it.each([
    ['an L', L_ROOF, 1],
    ['a T', T_ROOF, 2],
    ['a U', U_ROOF, 2],
    ['a C', C_ROOF, 2],
    ['a corner that points inward', INWARD, 1],
  ] as const)('%s has a valley from each corner that points inward', (_name, corners, inward) => {
    const roof = built(corners);
    const valleys = roof.faces.flatMap((face) => face.edges).filter((edge) => edge === 'valley');
    // Each valley parts two faces, and so is counted on both.
    expect(valleys.length).toBeGreaterThanOrEqual(inward * 2);
    expect(kindsOf(roof).has('valley')).toBe(true);
  });

  it('a T: the narrow stem’s ridge is lower than the main roof’s, and runs into it', () => {
    const roof = built(T_ROOF);
    const stemTop = 2 * RISE;
    const mainTop = 2.5 * RISE;
    expect(roof.topM).toBeCloseTo(mainTop, 6);
    // The stem's two faces meet on its middle line, east 6, at the stem's own ridge height.
    const stem = roof.faces.filter((face) => face.side === 1 || face.side === 3);
    expect(stem).toHaveLength(2);
    for (const face of stem) {
      expect(Math.max(...face.corners.map((corner) => corner.up))).toBeCloseTo(stemTop, 6);
    }
    // The two sides of the main roof either side of the stem are one face: one plane, one eave line.
    const foot = roof.faces.filter((face) => face.side === 0 || face.side === 4);
    expect(foot).toHaveLength(1);
  });

  it('a courtyard: the yard’s sides are eaves too, and the faces cover the ring between', () => {
    const hole = { corners: [...COURT.hole].reverse(), sides: eaves(COURT.hole) };
    const roof = facesFromSides({ corners: COURT.outer, sides: eaves(COURT.outer) }, [hole]);
    if (roof === null) throw new Error('the faces could not be built');
    expectCovers(roof, ringAreaM2(COURT.outer) - ringAreaM2(COURT.hole));
    expectOneHeight(roof);
    expect(roof.faces.filter((face) => face.ring === 1)).toHaveLength(4);
    expect(roof.faces.filter((face) => face.ring === 0)).toHaveLength(4);
  });

  it('an outline drawn clockwise builds the same roof', () => {
    const roof = built([...L_ROOF].reverse());
    expectCovers(roof, ringAreaM2(L_ROOF));
    expect(roof.topM).toBeCloseTo(2 * RISE, 6);
  });
});

describe('one plane for each side', () => {
  it('a gable: two faces, a ridge the length of the roof, and the ends are gable ends', () => {
    const roof = roofFormed(RECT, { shape: 'gable', slopeDeg: SLOPE });
    expect(roof.built).toBe('gable');
    expect(roof.faces.map((face) => face.side).sort()).toEqual([0, 2]);
    expect(lengthOf(roof, 'ridge')).toBeCloseTo(10, 6);
    expect(kindsOf(roof)).toEqual(new Set(['eave', 'ridge', 'gable_end']));
    expectCovers(roof, 60);
  });

  it.each([
    ['its eave sides 1 m apart in their lean', [p(0, 0), p(10, 0), p(10, 7), p(0, 6)]],
    ['drawn the other way round', [p(0, 6), p(10, 7), p(10, 0), p(0, 0)]],
    ['a long trapezoid', [p(0, 0), p(12, 0), p(10, 5), p(2, 4)]],
  ])('a gable on four sides, %s: two faces facing exactly opposite, covering it', (_, corners) => {
    const roof = roofFormed(corners, { shape: 'gable', slopeDeg: SLOPE });
    expect(roof.built).toBe('gable');
    expect(roof.faces).toHaveLength(2);
    const [one, two] = roof.faces.map((face) => face.downDeg);
    expect(((two ?? 0) - (one ?? 0) + 360) % 360).toBeCloseTo(180, 6);
    expectCovers(roof, ringAreaM2(corners));
    expectOneHeight(roof);
  });

  it('a turned gable carries its ridge the other way: its ends and eaves swap', () => {
    const roof = roofFormed(RECT, { shape: 'gable', slopeDeg: SLOPE, turned: true });
    expect(roof.faces.map((face) => face.side).sort()).toEqual([1, 3]);
    expect(lengthOf(roof, 'ridge')).toBeCloseTo(6, 6);
    expect(roof.topM).toBeCloseTo(5 * RISE, 6);
  });

  it.each([
    ['a rectangle: its short sides', RECT, false, [1, 3]],
    ['a rectangle, turned: its long sides', RECT, true, [0, 2]],
    ['an L: the end of each wing', L_ROOF, false, [1, 4]],
    ['a T: the end of the stem and both ends of the bar', T_ROOF, false, [2, 5, 7]],
    ['a U: the end of each arm', U_ROOF, false, [0, 4]],
  ] as const)('the gable ends of %s', (_name, corners, turned, ends) => {
    expect(gableEnds(corners, turned).sort((a, b) => a - b)).toEqual([...ends]);
  });

  it.each(NAMED.filter(([name]) => name !== 'a square'))(
    'a gable on %s: each wing its own, covering it, at true heights',
    (_name, corners) => {
      const roof = roofFormed(corners, { shape: 'gable', slopeDeg: SLOPE });
      expectCovers(roof, ringAreaM2(corners));
      expectOneHeight(roof);
      for (const face of roof.faces) expectSquareToEave(face, corners);
    },
  );

  it('a tap on one end turns it to a hip: a half-hip needs no new shape', () => {
    const sides = [{}, { end: 'hip' as const }, {}, {}];
    const roof = roofFormed(RECT, { shape: 'gable', slopeDeg: SLOPE, sides });
    expect(roof.faces.map((face) => face.side).sort()).toEqual([0, 1, 2]);
    expect(kindsOf(roof)).toEqual(new Set(['eave', 'ridge', 'hip', 'gable_end']));
    // The ridge runs from the gable end to where the hip end's face meets it, 3 m in.
    expect(lengthOf(roof, 'ridge')).toBeCloseTo(7, 6);
    expectCovers(roof, 60);
  });

  it('steep ends on a hip: the ends reach the ridge sooner, and it is longer', () => {
    const steep = { slopeDeg: 60 };
    const roof = roofFormed(RECT, { shape: 'hip', slopeDeg: SLOPE, sides: [{}, steep, {}, steep] });
    const run = (3 * RISE) / Math.tan((60 * Math.PI) / 180);
    expect(lengthOf(roof, 'ridge')).toBeCloseTo(10 - 2 * run, 6);
    expect(roof.topM).toBeCloseTo(3 * RISE, 6);
    expectCovers(roof, 60);
    expectOneHeight(roof);
  });

  it('uneven faces: one eave higher moves the ridge off the middle', () => {
    const sides = [{}, { end: 'gable' as const }, { eaveM: 1 }, { end: 'gable' as const }];
    const roof = roofFormed(RECT, { shape: 'gable', slopeDeg: SLOPE, sides });
    const low = roof.faces.find((face) => face.side === 0);
    const high = roof.faces.find((face) => face.side === 2);
    // The planes meet where 0 + rise·d = 1 + rise·(6 − d).
    const meet = (1 + 6 * RISE) / (2 * RISE);
    expect(Math.max(...(low?.corners ?? []).map((corner) => corner.north))).toBeCloseTo(meet, 6);
    expect(roof.topM).toBeCloseTo(meet * RISE, 6);
    if (low === undefined || high === undefined) throw new Error('a face is missing');
    expectSquareToEave(low, RECT);
    expectSquareToEave(high, RECT, 1);
    expectCovers(roof, 60);
  });

  it('two sides on one line with different slopes: a wall stands where the faces step', () => {
    const jogless = [p(0, 0), p(5, 0), p(10, 0), p(10, 6), p(0, 6)];
    const sides: SideShape[] = jogless.map((_, i) => ({
      gable: false,
      slopeDeg: i === 1 ? 45 : SLOPE,
      eaveM: 0,
    }));
    const roof = built(jogless, sides);
    expectCovers(roof, 60);
    expect(roof.faces.some((face) => face.side === 1 && face.edges.includes('gable_end'))).toBe(
      true,
    );
    for (const face of roof.faces) expectSquareToEave(face, jogless);
  });

  it('a mansard: a steep lower slope, a break, then a low upper slope on every side', () => {
    const roof = roofFormed(RECT, {
      shape: 'mansard',
      slopeDeg: 60,
      upperSlopeDeg: 25,
      breakInM: 0.6,
    });
    expect(roof.built).toBe('mansard');
    expect(roof.faces.filter((face) => !face.upper)).toHaveLength(4);
    expect(roof.faces.filter((face) => face.upper)).toHaveLength(4);
    const breakM = 0.6 * Math.tan((60 * Math.PI) / 180);
    const upperRise = Math.tan((25 * Math.PI) / 180);
    expect(roof.topM).toBeCloseTo(breakM + (3 - 0.6) * upperRise, 6);
    expect(kindsOf(roof).has('break')).toBe(true);
    expectCovers(roof, 60);
    expectOneHeight(roof);
  });

  it('a gambrel: the same two slopes, with gable ends', () => {
    const roof = roofFormed(RECT, {
      shape: 'gambrel',
      slopeDeg: 60,
      upperSlopeDeg: 25,
      breakInM: 0.6,
    });
    expect(roof.faces).toHaveLength(4);
    expect(kindsOf(roof)).toEqual(new Set(['eave', 'break', 'ridge', 'gable_end']));
    expectCovers(roof, 60);
  });
});

describe('faces only: straight corners and small jogs', () => {
  it('a corner on a straight side adds no face', () => {
    const roof = built([p(0, 0), p(4, 0), p(10, 0), p(10, 6), p(0, 6)]);
    expect(roof.faces).toHaveLength(4);
    expect(lengthOf(roof, 'ridge')).toBeCloseTo(4, 6);
  });

  it.each([
    [0.29, 4],
    [0.31, 6],
  ])('a jog of %s m in a wall: %s faces', (jog, faces) => {
    const roof = built([p(0, 0), p(5, 0), p(5, jog), p(10, jog), p(10, 6), p(0, 6)]);
    expect(roof.faces).toHaveLength(faces);
  });
});

describe('any right-angled outline', () => {
  const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

  it.each(SEEDS)('skyline %s: a hip and a gable both cover it and meet at one height', (seed) => {
    const corners = skyline(seed, 2 + (seed % 5));
    const area = ringAreaM2(corners);
    const hip = built(corners);
    expectCovers(hip, area);
    expectOneHeight(hip);
    for (const face of hip.faces) expectSquareToEave(face, corners);
    // A gable end is a standing wall, and across a wall two faces need not meet at one height: a
    // gable on a random outline is held to its planes.
    const gable = roofFormed(corners, { shape: 'gable', slopeDeg: SLOPE });
    expectCovers(gable, area);
    for (const face of gable.faces) expectSquareToEave(face, corners);
  });

  it('a 40-corner roof rebuilds its faces within one frame', () => {
    const corners = skyline(7, 19);
    expect(corners.length).toBeGreaterThanOrEqual(40);
    built(corners);
    // The clock here counts whole milliseconds: many runs make the mean fine enough.
    const started = Date.now();
    const RUNS = 50;
    for (let i = 0; i < RUNS; i++) built(corners);
    expect((Date.now() - started) / RUNS).toBeLessThan(16);
  });
});
