import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { cornerMagnet } from '../../src/studio/roof-corner-magnet';
import { cornerDragged } from '../../src/studio/roof-edit';
import { roofMoved, roofTurned } from '../../src/studio/roof-move';
import { snapTargetsOf } from '../../src/studio/roof-snap';
import { draftSpot } from '../../src/studio/roof-snap-spot';
import { drawing, drawTargetsOf } from '../../src/studio/roof-step-draw';
import { box, designOf, roofOf } from './roof-meet-support';

/**
 * The magnet helps on the house in hand alone (`T-M05-002`, parts b and e): a roof of another
 * building gives a drawing nothing — no corner, no wall, no line across the map — and where two
 * lines cross, the corner stays on one of them with a ghost at the crossing, taken only by a tap on
 * the ghost itself.
 */

const REACH = 0.5;
const at = (east: number, north: number): GroundPoint => ({ east, north });
// Orange and green touch: one house. The roof 15 m east is another building.
const ORANGE = roofOf('orange', box(0, 0, 10, 12));
const GREEN = roofOf('green', box(10, 0, 10, 12));
const roofsIn = (targets: ReturnType<typeof snapTargetsOf>) =>
  [...new Set(targets.edges.map(({ owner }) => owner.roof))].sort();

describe('only the house in hand guides the pen', () => {
  it('drawing on another building, orange’s wall line across the map holds nothing', () => {
    const state = drawing(true, [at(30, 20)]);
    if (state.kind !== 'drawing') throw new Error('not drawing');
    // 0.2 m off the line of orange's north wall, 11 m past its end.
    expect(roofsIn(drawTargetsOf(state, designOf(ORANGE), at(31, 12.2)))).toEqual([]);
    const spot = draftSpot(
      state.corners,
      at(31, 12.2),
      drawTargetsOf(state, designOf(ORANGE)),
      true,
      REACH,
    );
    expect(spot.point).toEqual(at(31, 12.2));
  });

  it('a corner on green brings green’s house in: orange guides too', () => {
    const state = drawing(true, [at(20, 6)]);
    if (state.kind !== 'drawing') throw new Error('not drawing');
    expect(roofsIn(drawTargetsOf(state, designOf(ORANGE, GREEN)))).toEqual([0, 1]);
  });

  it('the pen over orange, before the first corner, brings the house in', () => {
    const state = drawing(true);
    if (state.kind !== 'drawing') throw new Error('not drawing');
    expect(
      roofsIn(drawTargetsOf({ ...state, reach: REACH }, designOf(ORANGE, GREEN), at(5, 6))),
    ).toEqual([0, 1]);
    expect(
      roofsIn(drawTargetsOf({ ...state, reach: REACH }, designOf(ORANGE, GREEN), at(40, 6))),
    ).toEqual([]);
  });

  it('a corner of a roof on another building is not pulled onto orange’s corner', () => {
    const shed = roofOf('shed', box(30, 0, 4, 4));
    const placed = cornerMagnet(shed.corners, 0, at(10.2, 0.1), designOf(ORANGE, shed), 1, REACH);
    expect(placed.point).not.toEqual(at(10, 0));
    expect(placed.snap?.kind).not.toBe('corner_of');
  });
});

describe('a drag, a move or a turn: its own house guides it, another building never', () => {
  const RECT = roofOf('rect', box(0, 0, 8, 6));

  it('a corner dragged snaps to the corner of a roof of its house', () => {
    // The shed touches the roof's east wall: one house.
    const shed = roofOf('shed', box(8, 0, 4, 7));
    const drag = cornerDragged(designOf(RECT, shed), 0, 2, at(8.1, 6.8), true);
    expect(drag.snap).toEqual({ kind: 'corner_of', owner: { kind: 'roof', roof: 1 } });
    expect(drag.document.roofs[0]?.corners[2]).toEqual(at(8, 7));
  });

  it('a corner dragged toward a shed 1.4 m off is not pulled onto its corner', () => {
    const shed = roofOf('shed', box(9, 7, 3, 3));
    const drag = cornerDragged(designOf(RECT, shed), 0, 2, at(8.8, 6.8), true);
    expect(drag.snap?.kind).not.toBe('corner_of');
  });

  it('a roof moved past a roof 6 m off is held by none of its lines', () => {
    const shed = roofOf('shed', box(9, 6, 3, 2));
    const moved = roofMoved(designOf(RECT, shed), 1, at(5, 0.7), []);
    expect(moved.guides).toEqual([]);
    expect(moved.snap).toBeNull();
  });

  it('a turn 2.9° off a roof 22 m away stays as turned', () => {
    const far = roofOf('far', box(30, 0, 4, 4));
    const turn = roofTurned(designOf(RECT, far), 0, 2.9, true);
    expect(turn.snapped).toBe(false);
    expect(turn.degrees).toBeCloseTo(2.9);
  });
});

describe('a crossing is a ghost, taken by a tap on it', () => {
  // A rectangle's fourth corner: parallel to the long side and in line with the first corner.
  const corners = [at(0, 0), at(10, 0), at(10, 6)];
  const empty = snapTargetsOf([]);

  it('a tap a little off the crossing stays on the one line, with the ghost at the crossing', () => {
    const spot = draftSpot(corners, at(0.3, 6.1), empty, true, REACH);
    expect(spot.point.north).toBeCloseTo(6, 9);
    expect(spot.point.east).toBeCloseTo(0.3, 9);
    expect(spot.ghost).toEqual(at(0, 6));
  });

  it('a tap on the ghost takes the crossing', () => {
    const spot = draftSpot(corners, at(0.1, 6.05), empty, true, REACH);
    expect(spot.point.east).toBeCloseTo(0, 9);
    expect(spot.point.north).toBeCloseTo(6, 9);
    expect(spot.ghost).toBeUndefined();
  });
});

describe('a corner dragged by a crossing: a ghost, taken from on it', () => {
  // A rectangle's corner (8, 6): square at both neighbours there, its crossing.
  const RECT6 = designOf(roofOf('rect', box(0, 0, 8, 6)));
  it.each([
    ['on the crossing, within half the reach: taken, no ghost', at(8.1, 6.1), true, false],
    ['beside it, within the reach: one line, the ghost there', at(8.3, 6.25), false, true],
    ['past the reach: no ghost', at(8.7, 6.7), false, false],
  ] as const)('%s', (_why, to, taken, ghost) => {
    const drag = cornerDragged(RECT6, 0, 2, to, true, REACH);
    const corner = drag.document.roofs[0]?.corners[2];
    expect(corner?.east === 8 && corner?.north === 6).toBe(taken);
    expect(drag.ghost !== undefined).toBe(ghost);
    if (ghost) expect(drag.ghost).toEqual(at(8, 6));
    // No line is drawn twice.
    const keys = drag.guides.map(
      (g) => `${g.through.east},${g.through.north},${g.way.east},${g.way.north}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});
