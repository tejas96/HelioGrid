import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { cutInto, facesWithout, handFaces, movedIn } from '../../src/studio/roof-cuts';
import { roofFormed } from '../../src/studio/roof-forms';
import { ringAreaM2 } from '../../src/studio/roof-polygons';
import { L_ROOF, p, RECT } from './roof-kernel-support';

/**
 * What is cut out of a roof's faces and laid on them (`T-M05-002`, part e): a lower roof cut into
 * a higher one, a hole in the face it lies in, an outline moved in by each side's own distance,
 * and faces drawn by hand.
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

describe('cuts into the faces', () => {
  const house = roofFormed(box(0, 0, 12, 8), { shape: 'gable', slopeDeg: SLOPE });

  it('a porch gable against the house is cut into its face: valleys run up to its ridge', () => {
    // The porch stands in front of the south wall and runs 2 m under the house's south face.
    const porchRing = box(4, -3, 4, 5);
    const porch = roofFormed(porchRing, { shape: 'gable', slopeDeg: SLOPE });
    expect(porch.faces.map((face) => face.side).sort()).toEqual([1, 3]);
    const cut = cutInto(house.faces, porch.faces, 0);
    expect(kindsOf({ faces: cut.lower }).has('valley')).toBe(true);
    expect(kindsOf({ faces: cut.higher }).has('valley')).toBe(true);
    // Nothing is counted twice, and nothing is lost: house and porch together as seen from above.
    const total = [...cut.higher, ...cut.lower].reduce((sum, face) => sum + face.areaM2, 0);
    expect(total).toBeCloseTo(96 + 12, 6);
    // The porch's ridge, 2 m wide each side, meets the house's face where that face is as high.
    const reach = Math.max(
      ...cut.lower.flatMap((face) => face.corners.map((corner) => corner.north)),
    );
    expect(reach).toBeCloseTo(2, 6);
  });

  it('a lower roof wholly beside the higher one is left as it is', () => {
    const shed = roofFormed(box(12, 0, 3, 8), { shape: 'shed', slopeDeg: 10, side: 1 });
    const cut = cutInto(house.faces, shed.faces, 0);
    expect(cut.higher).toHaveLength(house.faces.length);
    expect(cut.lower.reduce((sum, face) => sum + face.areaM2, 0)).toBeCloseTo(24, 6);
  });

  it('a hole on a sloped roof cuts only the face it lies in', () => {
    const cut = facesWithout(house.faces, box(5, 1, 1, 1));
    const south = cut.filter((face) => face.side === 0);
    const north = cut.filter((face) => face.side === 2);
    expect(south.reduce((sum, face) => sum + face.areaM2, 0)).toBeCloseTo(48 - 1, 6);
    expect(north.reduce((sum, face) => sum + face.areaM2, 0)).toBeCloseTo(48, 6);
    // The duct is a ring cut out of the south face, at the face's own heights; the north face has none.
    expect(south.map((face) => face.holes?.length)).toEqual([1]);
    expect(north.map((face) => face.holes)).toEqual([undefined]);
    const duct = south[0]?.holes?.[0] ?? [];
    expect(Math.max(...duct.map((corner) => corner.up))).toBeCloseTo(2 * RISE, 6);
  });

  it('a hole on the edge of a face changes the face’s own edge: a wall where it was cut', () => {
    const cut = facesWithout(house.faces, box(5, -1, 1, 2));
    const south = cut.filter((face) => face.side === 0);
    expect(south.reduce((sum, face) => sum + face.areaM2, 0)).toBeCloseTo(48 - 1, 6);
    expect(kindsOf({ faces: south }).has('wall')).toBe(true);
    expect(south[0]?.holes).toBeUndefined();
  });
});

describe('an outline moved in', () => {
  it('each side by its own distance: a setback of 0.5 m, and none on a boundary side', () => {
    expect(movedIn(RECT, [0.5, 0.5, 0.5, 0.5])).toEqual([
      [p(0.5, 0.5), p(9.5, 0.5), p(9.5, 5.5), p(0.5, 5.5)],
    ]);
    const [ring] = movedIn(RECT, [0.5, 0, 0.5, 1]);
    expect(ringAreaM2(ring ?? [])).toBeCloseTo(9 * 5, 6);
    expect(ring).toContainEqual(p(10, 0.5));
  });

  it('follows a corner that points inward', () => {
    const [ring] = movedIn(
      L_ROOF,
      L_ROOF.map(() => 0.5),
    );
    expect(ring).toHaveLength(6);
    expect(ring).toContainEqual(p(3.5, 3.5));
    expect(ringAreaM2(ring ?? [])).toBeCloseTo(9 * 3 + 3 * 6, 6);
  });

  it('an outline drawn clockwise moves in the same', () => {
    const [ring] = movedIn([...RECT].reverse(), [1, 0, 0, 0]);
    // Side 0 of the clockwise ring runs along the north wall, 10 m long.
    expect(ringAreaM2(ring ?? [])).toBeCloseTo(10 * 5, 6);
    expect(ring).toContainEqual(p(0, 5));
  });

  it('a narrow neck parts the roof in two; a move past the middle leaves nothing', () => {
    const dumbbell = [
      p(0, 0),
      p(6, 0),
      p(6, 2),
      p(10, 2),
      p(10, 0),
      p(16, 0),
      p(16, 6),
      p(10, 6),
      p(10, 4),
      p(6, 4),
      p(6, 6),
      p(0, 6),
    ];
    expect(
      movedIn(
        dumbbell,
        dumbbell.map(() => 1.2),
      ),
    ).toHaveLength(2);
    expect(movedIn(RECT, [3.5, 3.5, 3.5, 3.5])).toEqual([]);
  });

  it('runs round what stands on the roof: a stair room’s walls are edges too', () => {
    const stair = { corners: [...box(4, 2, 2, 2)].reverse(), distances: [0.5, 0.5, 0.5, 0.5] };
    const rings = movedIn(RECT, [0.5, 0.5, 0.5, 0.5], [stair]);
    expect(rings).toHaveLength(2);
    const areas = rings.map((ring) => ringAreaM2(ring)).sort((a, b) => a - b);
    expect(areas[0]).toBeCloseTo(3 * 3, 6);
    expect(areas[1]).toBeCloseTo(9 * 5, 6);
  });
});

describe('faces drawn by hand', () => {
  it('each rises from its own low side; a face that starts on another’s high edge starts at its height', () => {
    const lower = { corners: box(0, 0, 10, 3), slopeDeg: SLOPE, lowSide: 0 };
    const upper = { corners: box(0, 3, 10, 3), slopeDeg: 10, lowSide: 0 };
    const [first, second] = handFaces([lower, upper]);
    expect(Math.max(...(first?.corners ?? []).map((corner) => corner.up))).toBeCloseTo(3 * RISE, 6);
    const rise10 = Math.tan((10 * Math.PI) / 180);
    expect(Math.min(...(second?.corners ?? []).map((corner) => corner.up))).toBeCloseTo(
      3 * RISE,
      6,
    );
    expect(Math.max(...(second?.corners ?? []).map((corner) => corner.up))).toBeCloseTo(
      3 * RISE + 3 * rise10,
      6,
    );
    expect(first?.downDeg).toBeCloseTo(180, 6);
    expect(first?.edges[0]).toBe('eave');
  });

  it('two faces that lean on each other at a ridge each start from the ground', () => {
    const south = { corners: box(0, 0, 10, 3), slopeDeg: SLOPE, lowSide: 0 };
    const north = { corners: box(0, 3, 10, 3), slopeDeg: SLOPE, lowSide: 2 };
    const faces = handFaces([south, north]);
    expect(faces.map((face) => Math.min(...face.corners.map((corner) => corner.up)))).toEqual([
      0, 0,
    ]);
    expect(faces[1]?.downDeg).toBeCloseTo(0, 6);
  });
});
