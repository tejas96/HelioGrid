import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofFormOf } from '../../src/studio/roof-built';
import {
  roofLengthsMeasuredTo,
  roofParapetAllRound,
  roofParapetBuilt,
  roofRidgeTurned,
  roofShapePicked,
  roofSideEnded,
  roofSideMarked,
  roofSideWallFollows,
} from '../../src/studio/roof-choices';
import { parapetNow } from '../../src/studio/roof-open-edges';
import { formPicksOf, lowSideOf } from '../../src/studio/roof-slope-way';
import { roofNumberSet } from '../../src/studio/roof-values-set';
import { box, designOf, FACTS, roofOf, SHED, TERRACE } from './roof-meet-support';

/**
 * What a person chooses on a roof's sheet and a side's (`T-M05-002`, part e): each choice is
 * theirs, a choice that is the studio's own start is not stored, and a side keeps what else it holds.
 */
const PUNE = 18.5;
const HOUSE = designOf(TERRACE, SHED);
const shaped = (is: string, more: object = {}): Roof =>
  ({ ...SHED, shape: { is, setBy: 'person', ...more } }) as Roof;
const person = { setBy: 'person' } as const;

describe('a person picks the shape', () => {
  it('the shape the studio guessed, picked, is theirs; picked again, nothing changes', () => {
    const guessed = roofFormOf(SHED, FACTS).shape;
    const mine = roofShapePicked(HOUSE, 1, guessed, FACTS);
    expect(mine.roofs[1]?.shape).toEqual({ is: guessed, setBy: 'person' });
    expect(roofShapePicked(mine, 1, guessed, FACTS)).toBe(mine);
  });

  // The roof held every shape's own value: each shape picked keeps the ones it uses.
  it.each([
    [
      'a gambrel keeps the two slopes and the turned ridge',
      'mansard',
      'gambrel',
      ['upperSlope', 'breakIn', 'turned'],
    ],
    [
      'a mansard keeps the two slopes; its ridge does not turn',
      'gambrel',
      'mansard',
      ['upperSlope', 'breakIn'],
    ],
    ['a gable keeps the turned ridge alone', 'mansard', 'gable', ['turned']],
    ['a sawtooth keeps its teeth', 'gable', 'sawtooth', ['teeth']],
    ['a hip’s ridge does not turn', 'gable', 'hip', []],
    ['a flat roof keeps nothing', 'sawtooth', 'flat', []],
  ] as const)('%s', (_why, from, to, kept) => {
    const all = {
      turned: true,
      teeth: { count: 5, ...person },
      upperSlope: { degrees: 20, ...person },
      breakIn: { metres: 1, ...person },
    };
    const picked = roofShapePicked(designOf(shaped(from, all)), 0, to, FACTS).roofs[0]?.shape;
    expect(Object.keys(picked ?? {}).sort()).toEqual(['is', 'setBy', ...kept].sort());
    expect(picked).toMatchObject({ is: to, setBy: 'person' });
  });

  it('a roof that is not there is not shaped', () => {
    expect(roofShapePicked(HOUSE, 5, 'hip', FACTS)).toBe(HOUSE);
  });
});

describe('the roof’s parapet', () => {
  const all = (design: typeof HOUSE, roof: number) =>
    parapetNow(design, design.roofs[roof] as Roof, FACTS);

  it('taken off a concrete terrace it is stored; put back, the roof is as the studio had it', () => {
    const off = roofParapetAllRound(HOUSE, 0, false, FACTS);
    expect(all(off, 0).allRound).toBe(false);
    expect(roofParapetAllRound(off, 0, true, FACTS).roofs[0]).toEqual(TERRACE);
  });

  it('put on a sheet roof, which starts with none, it is stored', () => {
    const on = roofParapetAllRound(HOUSE, 1, true, FACTS);
    expect(on.roofs[1]?.parapet).toMatchObject({ allRound: true });
    expect(roofParapetAllRound(on, 1, false, FACTS).roofs[1]).toEqual(SHED);
  });

  it('a height a person set stays when the parapet is switched', () => {
    const tall = roofNumberSet(HOUSE, { roof: 0, key: 'parapet_height' }, 1.4, FACTS);
    const off = roofParapetAllRound(tall, 0, false, FACTS);
    expect(off.roofs[0]?.parapet).toEqual({ allRound: false, metres: 1.4, setBy: 'person' });
  });

  it('a railing is stored; a wall, what a parapet is with no word on it, is not', () => {
    const railing = roofParapetBuilt(HOUSE, 0, 'railing', FACTS);
    expect(all(railing, 0).build).toBe('railing');
    expect(roofParapetBuilt(railing, 0, 'wall', FACTS).roofs[0]).toEqual(TERRACE);
  });

  it('lengths measured inside the parapet are stored; outside, the start, is not', () => {
    const inside = roofLengthsMeasuredTo(HOUSE, 0, 'inside', FACTS);
    expect(all(inside, 0).lengthsMeasured).toBe('inside');
    expect(roofLengthsMeasuredTo(inside, 0, 'outside', FACTS).roofs[0]).toEqual(TERRACE);
  });
});

describe('one side', () => {
  it('its parapet handed back follows the roof’s; its own height stays', () => {
    const own = roofOf('terrace', TERRACE.corners, {
      sides: [{}, { parapet: false, parapetM: 1.5 }, {}, {}],
    });
    const back = roofSideWallFollows(designOf(own), 0, 1);
    expect(back.roofs[0]?.sides?.[1]).toEqual({ parapetM: 1.5 });
  });

  it('a shed has one low side: marked on another side, it leaves the first', () => {
    const first = roofSideMarked(HOUSE, 1, 2, 'low');
    const moved = roofSideMarked(first, 1, 0, 'low');
    expect(moved.roofs[1]?.sides?.map((side) => side.low)).toEqual([
      'person',
      undefined,
      undefined,
      undefined,
    ]);
    expect(lowSideOf(moved, 1, FACTS, PUNE)).toMatchObject({ side: 0, byPerson: true });
  });

  it('the glass side takes the low side’s place, and keeps what else the side holds', () => {
    const low = roofOf('shed', SHED.corners, {
      sides: [{}, { low: 'system', setbackM: 0 }, {}, {}],
    });
    const glass = roofSideMarked(designOf(low), 0, 1, 'glass');
    expect(glass.roofs[0]?.sides?.[1]).toEqual({ setbackM: 0, glass: 'person' });
  });

  it.each([
    ['past the last side', 4],
    ['before the first', -1],
  ] as const)('a side %s is not marked, ended or handed back', (_why, side) => {
    expect(roofSideMarked(HOUSE, 1, side, 'low')).toBe(HOUSE);
    expect(roofSideEnded(HOUSE, 1, side, 'hip')).toBe(HOUSE);
    expect(roofSideWallFollows(HOUSE, 1, side)).toBe(HOUSE);
  });

  it('an end made a hip is that side’s; the other end stands', () => {
    const half = roofSideEnded(HOUSE, 1, 0, 'hip');
    expect(half.roofs[1]?.sides?.map((side) => side.end)).toEqual([
      'hip',
      undefined,
      undefined,
      undefined,
    ]);
  });
});

describe('a gable’s ridge', () => {
  it('turns from the way it runs, and back; the ends a person made go, the rest of a side stays', () => {
    const ended = roofOf('shed', SHED.corners, {
      shape: { is: 'gable', setBy: 'person' },
      sides: [{ end: 'hip', setbackM: 0 }, {}, {}, {}],
    });
    const turned = roofRidgeTurned(designOf(ended), 0, FACTS, false);
    expect(turned.roofs[0]?.shape).toEqual({ is: 'gable', setBy: 'person', turned: true });
    expect(turned.roofs[0]?.sides?.[0]).toEqual({ setbackM: 0 });
    expect(roofRidgeTurned(turned, 0, FACTS, false).roofs[0]?.shape?.turned).toBe(false);
  });

  it('where the studio already runs it the other way, a turn runs it the first way', () => {
    const turned = roofRidgeTurned(designOf(shaped('gable')), 0, FACTS, true);
    expect(turned.roofs[0]?.shape?.turned).toBe(false);
    expect(turned.roofs[0]?.sides).toBeUndefined();
  });
});

describe('what the studio picks for a roof’s form where no person has', () => {
  // 6 × 6 m: no side is clearly longer.
  const square = (is: string) =>
    designOf(roofOf('r', box(0, 0, 6, 6), { shape: { is, ...person } }));

  it.each([
    ['a flat roof: nothing', 'flat', {}],
    ['a hip: nothing', 'hip', {}],
    // North of the equator the sun is in the south: side 0 of this box looks south, side 2 north.
    ['a shed: its low side looks at the equator', 'shed', { side: 0 }],
    ['a sawtooth: its glass looks away from the equator', 'sawtooth', { side: 2 }],
    ['a butterfly is measured from its low side', 'butterfly', { side: 0 }],
  ] as const)('%s', (_why, is, picks) => {
    expect(formPicksOf(square(is), 0, FACTS, PUNE)).toEqual(picks);
  });

  it('a gable with no clearly longer side: whether its ridge is turned to look at the equator', () => {
    expect(formPicksOf(square('gable'), 0, FACTS, PUNE)).toHaveProperty('turned');
    expect(formPicksOf(HOUSE, 9, FACTS, PUNE)).toEqual({});
  });

  it('what the roof stores wins over the studio’s picks', () => {
    const marked = roofOf('r', box(0, 0, 6, 6), {
      shape: { is: 'gable', turned: false, ...person },
      sides: [{}, {}, {}, { low: 'person' }],
    });
    expect(roofFormOf(marked, FACTS, { side: 0, turned: true })).toMatchObject({
      side: 3,
      turned: false,
    });
    const bare = roofOf('r', box(0, 0, 6, 6), { shape: { is: 'gable', ...person } });
    expect(roofFormOf(bare, FACTS, { side: 0, turned: true })).toMatchObject({
      side: 0,
      turned: true,
    });
  });
});
