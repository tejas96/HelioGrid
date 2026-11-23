import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofBuilt } from '../../src/studio/roof-built';
import { roofMoved, roofTurned } from '../../src/studio/roof-move';
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
