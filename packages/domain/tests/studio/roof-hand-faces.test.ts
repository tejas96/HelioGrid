import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofBuilt } from '../../src/studio/roof-built';
import { lengthSet } from '../../src/studio/roof-length';
import { roofMoved, roofToCentimetre, roofTurned } from '../../src/studio/roof-move';
import { drawingsAfterPinMove } from '../../src/studio/site-moved';
import { box, designOf, FACTS, p, roofOf } from './roof-meet-support';

/**
 * Any shape's faces drawn by hand (`T-M05-002`, part e, E082): read and kept from this release —
 * the roof is built from them, and a move or a turn carries them with the roof.
 */
const FACE_A = {
  corners: [p(0, 0), p(4, 0), p(4, 4), p(0, 4)],
  slope: { degrees: 20, setBy: 'person' as const },
  lowSide: 0,
};
const FACE_B = {
  corners: [p(4, 0), p(8, 0), p(8, 4), p(4, 4)],
  slope: { degrees: 30, setBy: 'person' as const },
  lowSide: 0,
};
const DRAWN: Roof = roofOf('drawn', box(0, 0, 8, 4), {
  shape: { is: 'any', setBy: 'person', faces: [FACE_A, FACE_B] },
});

describe('a roof of any shape with faces drawn by hand', () => {
  it('is built from those faces, each at its own slope', () => {
    const built = roofBuilt(DRAWN, FACTS);
    expect(built.faces.map((face) => face.slopeDeg)).toEqual([20, 30]);
    expect(built.topM).toBeGreaterThan(0);
  });

  it('with none drawn yet, it stands flat', () => {
    const none = roofOf('none', box(0, 0, 8, 4), { shape: { is: 'any', setBy: 'person' } });
    expect(roofBuilt(none, FACTS).faces.every((face) => face.slopeDeg === 0)).toBe(true);
  });

  const sloped = (roof: Roof) => roofBuilt(roof, FACTS).faces.some((face) => face.slopeDeg > 0);
  it.each([
    ['a corner moved out', false, [p(0, 0), p(9, 0), p(8, 4), p(0, 4)]],
    ['a corner moved in', false, [p(0, 0), p(7, 0), p(8, 4), p(0, 4)]],
    ['a corner added on an edge', true, [p(0, 0), p(4, 0), p(8, 0), p(8, 4), p(0, 4)]],
    ['a corner added off the edge', false, [p(0, 0), p(4, -1), p(8, 0), p(8, 4), p(0, 4)]],
    ['nothing changed', true, box(0, 0, 8, 4)],
  ] as const)('an outline with %s keeps its faces: %s', (_why, kept, corners) => {
    // An older app version moves a corner and keeps faces it does not read: they no longer fit,
    // and the roof stands flat until faces are drawn again.
    expect(sloped({ ...DRAWN, corners, edges: corners.map(() => 'traced') })).toBe(kept);
  });

  it('a big roof with a corner moved a little out loses its faces too', () => {
    const half = (west: number) => ({
      corners: [p(west, 0), p(west + 10, 0), p(west + 10, 20), p(west, 20)],
      slope: { degrees: 20, setBy: 'person' as const },
      lowSide: 0,
    });
    const big = roofOf('big', box(0, 0, 20, 20), {
      shape: { is: 'any', setBy: 'person', faces: [half(0), half(10)] },
    });
    expect(sloped(big)).toBe(true);
    // 0.39 m out on a 20 m side: under 1% of the roof, still a hole of nearly 4 m² by the faces.
    const corners = [p(0, 0), p(20.39, 0), p(20, 20), p(0, 20)];
    expect(sloped({ ...big, corners })).toBe(false);
  });

  it('a fixed pin carries its faces with its corners', () => {
    const pin = { latitude: 16.845_6, longitude: 74.601_2 };
    const after = drawingsAfterPinMove(
      [designOf(DRAWN)],
      pin,
      { ...pin, latitude: 16.845_62 },
      false,
    );
    const moved = after.kind === 'done' ? after.documents[0]?.roofs[0] : undefined;
    expect(moved?.corners[0]).not.toEqual(DRAWN.corners[0]);
    expect(moved === undefined ? false : sloped(moved)).toBe(true);
  });

  it('the first true length stretches its faces with the picture', () => {
    const sized = lengthSet(designOf(DRAWN), 0, 0, 10, 'typed');
    const roof = sized.kind === 'done' ? sized.document.roofs[0] : undefined;
    expect(roof?.corners[1]?.east).toBeCloseTo(10, 6);
    expect(roof === undefined ? false : sloped(roof)).toBe(true);
  });

  it('kept to the centimetre, its corners and faces round together and still fit', () => {
    // Drawn off the centimetre, its south and north edges aslant, split at a point along each:
    // kept to the centimetre, the split leaves its edges, and the faces miss 0.075 m² of it.
    const south = (east: number) => p(east + 0.123_456, 0.137 * east + 0.654_321);
    const north = (east: number) => p(east + 0.123_456, 9 - 0.071 * east + 0.654_321);
    const split = 5.331_63;
    const face = (corners: ReturnType<typeof p>[]) => ({
      corners,
      slope: { degrees: 20, setBy: 'person' as const },
      lowSide: 0,
    });
    const roof = roofOf('odd', [south(0), south(12), north(12), north(0)], {
      shape: {
        is: 'any',
        setBy: 'person',
        faces: [
          face([south(0), south(split), north(split), north(0)]),
          face([south(split), south(12), north(12), north(split)]),
        ],
      },
    });
    const kept = roofToCentimetre(roof);
    expect(kept.corners[0]).toEqual(p(0.12, 0.65));
    expect(kept.shape?.faces?.[0]?.corners[1]).toEqual(p(5.46, 1.38));
    expect(sloped(kept)).toBe(true);
  });

  it('kept to the centimetre on a 30° edge, a face corner on the edge still fits', () => {
    // The edge's ends and the corner along it each round on their own: here the corner ends
    // 1.16 cm off the rounded edge, more than a centimetre, less than its square root of two.
    const a = p(0.003, 0.0041);
    const b = p(10.0051, 5.774_732_691_896_256);
    const along = (from: ReturnType<typeof p>, to: ReturnType<typeof p>, t: number) =>
      p(from.east + (to.east - from.east) * t, from.north + (to.north - from.north) * t);
    const d = p(0.003, 8.0041);
    const c = p(10.0051, 13.774_732_691_896_256);
    const [split, splitTop] = [along(a, b, 0.676), along(d, c, 0.676)];
    const face = (corners: ReturnType<typeof p>[]) => ({
      corners,
      slope: { degrees: 20, setBy: 'person' as const },
      lowSide: 0,
    });
    const roof = roofOf('aslant', [a, b, c, d], {
      shape: {
        is: 'any',
        setBy: 'person',
        faces: [face([a, split, splitTop, d]), face([split, b, c, splitTop])],
      },
    });
    expect(sloped(roofToCentimetre(roof))).toBe(true);
  });

  it('a move carries its faces with it', () => {
    const moved = roofMoved(designOf(DRAWN), 0, p(10, 5)).document.roofs[0];
    expect(moved?.shape?.faces?.[0]?.corners[0]).toEqual(p(10, 5));
    expect(moved?.shape?.faces?.[1]?.corners[2]).toEqual(p(18, 9));
  });

  it('a turn carries them too', () => {
    const turned = roofTurned(designOf(DRAWN), 0, 90, false).document.roofs[0];
    const corner = turned?.shape?.faces?.[0]?.corners[0];
    expect(corner?.east).toBeCloseTo(turned?.corners[0]?.east ?? Number.NaN, 6);
    expect(corner?.north).toBeCloseTo(turned?.corners[0]?.north ?? Number.NaN, 6);
  });
});
