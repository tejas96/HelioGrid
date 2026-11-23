import { describe, expect, it } from 'vitest';
import { roofPickedAt } from '../../src/studio/roof-pick';
import { roofStepAfter } from '../../src/studio/roof-step';
import { ROOF_STEP_START } from '../../src/studio/roof-step-state';
import { box, designOf, kindOf, p, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * The roof a tap picks where roofs lie on roofs (`T-M05-002`, part e): the top one first, the one
 * under it at the next tap, and round again.
 */
const STAIR = stairOn(box(0, 0, 3, 3));
const TANK = kindOf('tank', 'upper_floor', box(1, 1, 1, 1), { on: 'stair' });
const HOUSE = designOf(TERRACE, STAIR, TANK, SHED);

describe('the roof a tap picks', () => {
  it.each([
    ['open ground picks none', p(40, 40), null, null],
    ['the terrace alone', p(8, 6), null, 0],
    ['the terrace again, tapped while picked', p(8, 6), 0, 0],
    ['on the stair room: the stair room first', p(2.5, 2.5), null, 1],
    ['then the terrace under it', p(2.5, 2.5), 1, 0],
    ['and round to the stair room again', p(2.5, 2.5), 0, 1],
    ['three deep: the room on the stair room first', p(1.5, 1.5), null, 2],
    ['then the stair room', p(1.5, 1.5), 2, 1],
    ['then the terrace', p(1.5, 1.5), 1, 0],
    ['with another roof picked, the top one again', p(1.5, 1.5), 3, 2],
  ])('%s', (_why, at, picked, roof) => {
    expect(roofPickedAt(HOUSE, at, picked)).toBe(roof);
  });

  it('an open shed over the whole terrace is bigger than it, and still the top roof', () => {
    const shed = kindOf('over', 'open_shed', box(-1, -1, 12, 10), { on: 'terrace' });
    const covered = designOf(shed, TERRACE);
    expect(roofPickedAt(covered, p(5, 5), null)).toBe(0);
    expect(roofPickedAt(covered, p(5, 5), 0)).toBe(1);
  });

  it('two roofs on the ground over each other: the smaller first, then the bigger', () => {
    const over = designOf(TERRACE, roofOf('yard', box(-5, -5, 30, 30)));
    expect(roofPickedAt(over, p(5, 5), null)).toBe(0);
    expect(roofPickedAt(over, p(5, 5), 0)).toBe(1);
  });

  it('two roofs of one size over each other: the last drawn first', () => {
    const twin = designOf(TERRACE, roofOf('twin', TERRACE.corners));
    expect(roofPickedAt(twin, p(5, 5), null)).toBe(1);
  });

  it('a ring of links from another studio still picks', () => {
    const ring = designOf(
      roofOf('a', box(0, 0, 4, 4), { on: 'b' }),
      roofOf('b', box(0, 0, 6, 6), { on: 'a' }),
    );
    expect(roofPickedAt(ring, p(1, 1), null)).not.toBeNull();
  });

  it('the roof step picks with it: one tap, then the next', () => {
    const tap = { kind: 'tap', at: p(2.5, 2.5), system: 'metric' } as const;
    const first = roofStepAfter(ROOF_STEP_START, tap, HOUSE);
    expect(first.state).toMatchObject({ kind: 'idle', roof: 1 });
    expect(first.commit).toBeNull();
    expect(roofStepAfter(first.state, tap, HOUSE).state).toMatchObject({ kind: 'idle', roof: 0 });
  });
});
