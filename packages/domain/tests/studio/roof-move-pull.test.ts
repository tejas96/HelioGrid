import { describe, expect, it } from 'vitest';
import { roofMoved } from '../../src/studio/roof-move';
import { parapetInsidesOf } from '../../src/studio/roof-parapet-inside';
import { box, designOf, FACTS, p, stairOn, TERRACE } from './roof-meet-support';

/**
 * A roof dragged onto another (`T-M05-002`, part e, E130): with the magnet on, a corner within
 * reach of the other roof's edge, or of the inside face of its parapet, pulls the roof onto it.
 */
const STAIR = stairOn(box(2, 2, 3, 3));
const HOUSE = designOf(TERRACE, STAIR);
const insides = parapetInsidesOf(HOUSE, FACTS);
const westOf = (design: typeof HOUSE) =>
  Math.min(...(design.roofs[1]?.corners.map((c) => c.east) ?? []));

describe('a roof moved on another, the magnet on', () => {
  it('the terrace’s parapet stands its thickness in from each side', () => {
    const west = insides.find(
      (edge) => edge.owner.roof === 0 && edge.from.east === edge.to.east && edge.from.east < 1,
    );
    expect(west?.from.east).toBeCloseTo(FACTS.wallThicknessM, 6);
  });

  it('a railing’s inside face stands its 5 cm in, never the wall’s thickness', () => {
    const rail = {
      ...TERRACE,
      parapet: { allRound: true, metres: 1, setBy: 'person' as const, build: 'railing' as const },
    };
    const west = parapetInsidesOf(designOf(rail), FACTS).find(
      (edge) => edge.owner.roof === 0 && edge.from.east === edge.to.east && edge.from.east < 1,
    );
    expect(west?.from.east).toBeCloseTo(0.05, 6);
  });

  it.each([
    [
      'near the parapet’s inside face, it pulls against it',
      -1.6,
      FACTS.wallThicknessM,
      'inside_parapet',
    ],
    ['near the roof’s edge, it pulls onto the edge', -1.9, 0, 'edge_of'],
    ['far from both, it moves as dragged', -1, 1, null],
  ] as const)('%s', (_why, east, west, kind) => {
    const moved = roofMoved(HOUSE, 1, p(east, 0), insides);
    expect(westOf(moved.document)).toBeCloseTo(west, 6);
    expect(moved.snap?.kind ?? null).toBe(kind);
  });

  it('with the magnet off, it moves as dragged', () => {
    const moved = roofMoved(HOUSE, 1, p(-1.6, 0), null);
    expect(westOf(moved.document)).toBeCloseTo(0.4, 6);
    expect(moved.snap).toBeNull();
  });
});
