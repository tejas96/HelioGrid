import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofStepAfter } from '../../src/studio/roof-step';
import { ROOF_STEP_START, type RoofStepEvent } from '../../src/studio/roof-step-state';
import { roofSetFree, sticksOutM, stuckOutBy } from '../../src/studio/roof-sticks-out';
import { box, designOf, kindOf, p, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';
import { run, saidOf } from './roof-step-support';

/**
 * A roof past the edge of the roof it stands on (`T-M05-002`, part e): it is never refused and
 * nothing jumps back; what sticks out is marked to check, and a roof dragged clear is its own roof.
 */
const STAIR = stairOn(box(0, 0, 3, 3));
const HOUSE = designOf(TERRACE, STAIR, SHED);
const stairAt = (west: number, south: number) => designOf(TERRACE, stairOn(box(west, south, 3, 3)));

describe('how far a roof sticks out past the roof it stands on', () => {
  it.each([
    ['on the outer wall, inside its roof', stairAt(0, 0), 0],
    ['half a centimetre past the edge is on it', stairAt(-0.005, 0), 0],
    ['0.8 m past the west edge', stairAt(-0.8, 2), 0.8],
    ['past a corner: the farthest corner counts', stairAt(-0.3, -0.4), 0.5],
    ['clear of its roof by 2 m', stairAt(-5, 0), 5],
  ])('%s', (_why, design, metres) => {
    expect(sticksOutM(design, 1)).toBeCloseTo(metres, 6);
  });

  it('a roof on the ground, or one whose roof is gone, sticks out of nothing', () => {
    expect(sticksOutM(HOUSE, 0)).toBe(0);
    expect(sticksOutM(designOf(stairOn(box(0, 0, 3, 3), 'gone')), 0)).toBe(0);
    expect(sticksOutM(HOUSE, 9)).toBe(0);
  });

  it('a hole counts from the roof it is part of', () => {
    const duct = kindOf('duct', 'hole', box(9.5, 3, 1, 1), { partOf: 'terrace' });
    expect(sticksOutM(designOf(TERRACE, duct), 1)).toBeCloseTo(0.5, 6);
  });

  it('only a roof that sticks out farther than before is named', () => {
    expect(stuckOutBy(HOUSE, HOUSE)).toBeNull();
    expect(stuckOutBy(stairAt(-0.8, 2), stairAt(-0.8, 2))).toBeNull();
    expect(stuckOutBy(stairAt(0, 0), stairAt(-0.8, 2))).toBe(1);
  });
});

describe('a roof dragged clear of the roof it stood on', () => {
  it('half out it stays what it is', () => {
    const half = stairAt(-1.5, 0);
    expect(roofSetFree(half, 1)).toBe(half);
  });

  it('fully out it is its own roof: no kind, no link, the ground’s height again', () => {
    const tall = { ...stairOn(box(-5, 0, 3, 3)), height: { metres: 3, setBy: 'system' } } as Roof;
    const free = roofSetFree(designOf(TERRACE, tall), 1).roofs[1] as Roof;
    expect(Object.keys(free).sort()).toEqual(['corners', 'edges', 'height', 'id', 'tracedOn']);
    expect(free.height).toBeNull();
  });

  it('a height a person set stays theirs', () => {
    const mine = { ...stairOn(box(-5, 0, 3, 3)), height: { metres: 2.4, setBy: 'person' } } as Roof;
    expect(roofSetFree(designOf(TERRACE, mine), 1).roofs[1]?.height).toEqual(mine.height);
  });

  it('touching its roof only along an edge, it is clear of it', () => {
    const beside = designOf(TERRACE, stairOn(box(-3, 0, 3, 3)));
    expect(roofSetFree(beside, 1).roofs[1]).not.toHaveProperty('on');
  });
});

describe('the roof step after such a drag', () => {
  const drag = (roof: number, from: [number, number], to: [number, number]): RoofStepEvent[] => [
    { kind: 'grab', grip: { kind: 'move', roof }, at: p(...from), system: 'metric', magnet: false },
    { kind: 'drag', at: p(...to) },
    { kind: 'release' },
  ];

  it('the stair room dragged half out stays a stair room, and the line says it sticks out', () => {
    const { state, document, commits } = run(drag(1, [1, 1], [-0.5, 1]), HOUSE);
    expect(commits).toBe(1);
    expect(document.roofs[1]).toMatchObject({ kind: { is: 'stair_room' }, on: 'terrace' });
    expect(saidOf(state)).toEqual({
      kind: 'sticks_out',
      roof: 1,
      name: { kind: 'stair_room', with: 1 },
    });
  });

  it('dragged fully out it becomes its own roof, as one change', () => {
    const { state, document, commits } = run(drag(1, [1, 1], [1, -9]), HOUSE);
    expect(commits).toBe(1);
    expect(document.roofs[1]).not.toHaveProperty('kind');
    expect(document.roofs[1]).not.toHaveProperty('on');
    expect(saidOf(state)).toEqual({ kind: 'set_free', roof: 1, name: { kind: 'roof', number: 2 } });
  });

  it('moved within its roof it says only that it moved', () => {
    expect(saidOf(run(drag(1, [1, 1], [3, 3]), HOUSE).state)).toEqual({ kind: 'roof_moved' });
  });

  it('the terrace made smaller keeps its new shape, and the line says the stair room sticks out', () => {
    const grab: RoofStepEvent = {
      kind: 'grab',
      grip: { kind: 'corner', roof: 0, corner: 0 },
      at: p(0, 0),
      system: 'metric',
      magnet: false,
    };
    const { state, document } = run(
      [grab, { kind: 'drag', at: p(0.8, 0.8) }, { kind: 'release' }],
      designOf(roofOf('terrace', TERRACE.corners), STAIR),
    );
    expect(document.roofs[0]?.corners[0]).toEqual(p(0.8, 0.8));
    expect(document.roofs[1]?.corners).toEqual(STAIR.corners);
    expect(saidOf(state)).toMatchObject({ kind: 'sticks_out', roof: 1 });
  });

  it('a corner of the terrace removed from under the stair room says so too', () => {
    const picked = roofStepAfter(
      ROOF_STEP_START,
      { kind: 'pick_corner', corner: { roof: 0, corner: 0 } },
      HOUSE,
    );
    const after = roofStepAfter(picked.state, { kind: 'remove_corner' }, HOUSE);
    expect(after.commit?.roofs[0]?.corners).toHaveLength(3);
    expect(saidOf(after.state)).toMatchObject({ kind: 'sticks_out', roof: 1 });
  });
});
