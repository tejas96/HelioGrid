import { describe, expect, it } from 'vitest';
import { roofSideMarked } from '../../src/studio/roof-choices';
import { roofTopMarksOf } from '../../src/studio/roof-top-marks-build';
import { roofsWorked } from '../../src/studio/roof-worked';
import { box, designOf, FACTS, stairOn, TERRACE } from './roof-meet-support';
import { LEAN } from './roof-sheet-support';

/**
 * The top view's setback line and low-side tag (`T-M05-002`, part e, E116, E117, E088): the line
 * runs in from the roof's edge and round what stands on it; a low side against a taller wall says so.
 */
const marksOf = (design: ReturnType<typeof designOf>) =>
  roofTopMarksOf(design, FACTS, roofsWorked(design, FACTS, 18.5), 18.5);

describe('the top view’s setback and low side', () => {
  it('a terrace’s setback is one ring, inside its outline', () => {
    const [terrace] = marksOf(designOf(TERRACE));
    expect(terrace?.setback).toHaveLength(1);
    const ring = terrace?.setback[0] ?? [];
    expect(Math.min(...ring.map((c) => c.east))).toBeGreaterThan(0);
  });

  it('with a stair room on it, the line runs round the stair room too', () => {
    const [terrace, stair] = marksOf(designOf(TERRACE, stairOn(box(4, 3, 2, 2))));
    expect(terrace?.setback).toHaveLength(2);
    expect(stair?.setback.length).toBeGreaterThan(0);
  });

  it('a low side against a taller roof’s wall carries its tag; turned away, none', () => {
    const lean = { ...LEAN, height: { metres: 2.4, setBy: 'person' as const } };
    const against = roofSideMarked(designOf(TERRACE, lean), 1, 3, 'low');
    expect(marksOf(against)[1]?.lowAgainst).toEqual({
      at: { east: 10, north: 4 },
      roof: { kind: 'roof', number: 1 },
    });
    const away = roofSideMarked(designOf(TERRACE, lean), 1, 1, 'low');
    expect(marksOf(away)[1]?.lowAgainst).toBeNull();
  });
});
