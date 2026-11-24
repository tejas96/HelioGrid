import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { groundRoofHeightM, roofHeightOf } from '../../src/studio/roof-height';
import { roofFloorM, roofOwnHeightM } from '../../src/studio/roof-levels';
import { cutToEdge, meetingOf } from '../../src/studio/roof-meet';
import { ringAreaM2 } from '../../src/studio/roof-polygons';
import {
  box,
  designOf,
  FACTS,
  kindOf,
  p,
  roofOf,
  SHED,
  stairOn,
  TERRACE,
} from './roof-meet-support';

/**
 * How a new roof meets the roofs already standing (`T-M05-002`, part e): what it is first guessed
 * to be, which roof it stands on and belongs to, and the chips that fix a wrong guess.
 */
const HOUSE = designOf(TERRACE, SHED);
const meet = (corners: ReturnType<typeof box>, design = HOUSE) => meetingOf(design, corners, FACTS);

describe('a new roof inside another', () => {
  it.each([
    ['a stair room on the terrace’s corner, 3 × 3 m', box(0, 0, 3, 3), 'stair_room'],
    [
      'drawn 0.2 m inside the outer walls: still inside, and met with them',
      box(0.2, 0.2, 3, 3),
      'stair_room',
    ],
    ['a duct of 1 m²: a hole', box(6, 5, 1, 1), 'hole'],
    ['3.99 m²: a hole', box(4, 3, 1.9, 2.1), 'hole'],
    ['4 m² and no narrow side: a stair room', box(4, 3, 2, 2), 'stair_room'],
    ['a shaft 1.4 m wide, though 7 m²: a hole', box(4, 1, 1.4, 5), 'hole'],
    ['19.8 m²: a stair room', box(2, 2, 4.5, 4.4), 'stair_room'],
    ['20 m²: an upper floor', box(2, 2, 5, 4), 'upper_floor'],
  ] as const)('%s', (_why, corners, kind) => {
    const met = meet([...corners]);
    expect(met.place).toBe('inside');
    expect(met.kind).toBe(kind);
    expect(met.on).toBe(0);
    expect(met.partOf).toBeNull();
    expect(met.toCheck).toBe(true);
    // The guess is the first chip; the other likely kinds follow, and Separate part is always there.
    expect(met.choices[0]).toBe(kind);
    expect([...met.choices].sort()).toEqual(
      [
        kind === 'upper_floor' ? 'upper_floor' : 'stair_room',
        'hole',
        'open_shed',
        'separate_part',
      ].sort(),
    );
  });

  it('a roof drawn on the outer wall is moved onto it, so it shares the wall', () => {
    expect(meet(box(0.2, 0.2, 3, 3)).corners[0]).toEqual(p(0, 0));
  });

  it('inside a sloped roof: a dormer', () => {
    const met = meet(box(11, 2, 1.5, 2));
    expect(met.kind).toBe('dormer');
    expect(met.on).toBe(1);
    expect(met.choices).toEqual(['dormer', 'stair_room', 'hole', 'open_shed', 'separate_part']);
  });

  it('a roof already standing never changes what it is because a new one was drawn', () => {
    const before = JSON.stringify(HOUSE);
    meet(box(-1, -1, 16, 10));
    expect(JSON.stringify(HOUSE)).toBe(before);
  });
});

describe('a new roof beside the others', () => {
  it('apart from every roof: its own building', () => {
    const met = meet(box(30, 0, 5, 5));
    expect(met).toMatchObject({
      place: 'apart',
      kind: 'building',
      on: null,
      joinWith: null,
      toCheck: false,
    });
    expect(met.choices).toEqual(['building', 'open_shed']);
  });

  it('along a flat roof’s edge at its height: a building, and Join is one chip away', () => {
    const met = meet(box(0, 8, 6, 4), designOf(TERRACE));
    expect(met).toMatchObject({ place: 'beside', kind: 'building', joinWith: 0, joinFirst: false });
    expect(met.choices).toEqual(['building', 'join', 'open_shed']);
  });

  it('along a sloped roof’s edge at its height: Join is the first guess', () => {
    const met = meet(box(14, 2, 5, 4));
    expect(met).toMatchObject({ place: 'beside', joinWith: 1, joinFirst: true });
    expect(met.choices).toEqual(['join', 'building', 'open_shed']);
  });

  it.each([
    ['of the neighbour’s material and sloped: Join first', 'trapezoidal_sheet', 'gable', true],
    ['of another material: Join is offered, not first', 'clay_tile', 'gable', false],
    ['of the neighbour’s material and flat: not first', 'trapezoidal_sheet', 'flat', false],
  ] as const)('a roof that already says what it is, %s', (_why, type, shape, first) => {
    const as = roofOf('moved', box(14, 2, 5, 4), {
      material: { type, setBy: 'person', confirmed: true },
      shape: { is: shape, setBy: 'person' },
    });
    const met = meetingOf(HOUSE, as.corners, FACTS, as);
    expect(met).toMatchObject({ place: 'beside', joinWith: 1, joinFirst: first });
    expect(met.choices[0]).toBe(first ? 'join' : 'building');
  });

  it('along the edge of a roof at another height: no Join', () => {
    const tall = roofOf('tall', box(0, 0, 10, 8), { height: { metres: 6, setBy: 'person' } });
    const met = meet(box(10, 0, 4, 8), designOf(tall));
    expect(met).toMatchObject({ place: 'beside', joinWith: null });
    expect(met.choices).toEqual(['building', 'open_shed']);
  });

  it.each([
    ['0.3 m from the edge: met, and beside', 10.3 + 4, 'beside'],
    ['0.31 m from the edge: apart', 10.31 + 4, 'apart'],
  ])('a roof drawn %s', (_why, west, place) => {
    expect(meet(box(west, 0, 3, 8)).place).toBe(place);
  });

  it('touching at a corner alone is not along an edge: its own building, with no Join', () => {
    expect(meet(box(-4, -4, 4, 4), designOf(TERRACE))).toMatchObject({
      place: 'apart',
      joinWith: null,
    });
  });
});

describe('a new roof over others: none is refused', () => {
  it('over a whole roof, past its edges: an open shed, and no cut that would leave nothing', () => {
    const met = meet(box(-0.5, -0.5, 11, 9), designOf(TERRACE));
    expect(met).toMatchObject({ place: 'over_whole', kind: 'open_shed', on: 0, toCheck: true });
    expect(met.choices).toEqual(['open_shed', 'upper_floor']);
  });

  it('over a whole roof and past one edge: an open shed, or cut back to the edge', () => {
    const drawn = box(0, 0, 14, 8);
    const met = meet(drawn, designOf(TERRACE));
    expect(met).toMatchObject({ place: 'over_whole', kind: 'open_shed' });
    expect(met.choices).toEqual(['open_shed', 'upper_floor', 'cut_to_edge']);
    expect(ringAreaM2(cutToEdge(designOf(TERRACE), drawn) ?? [])).toBeCloseTo(4 * 8, 6);
  });

  it('partly over a roof: an upper floor that sticks out, or cut back to the edge', () => {
    const drawn = box(9.3, 0, 4.7, 8);
    const met = meet(drawn, designOf(TERRACE));
    expect(met).toMatchObject({ place: 'partly_over', kind: 'upper_floor', on: 0 });
    expect(met.choices).toEqual(['upper_floor', 'open_shed', 'cut_to_edge']);
    const cut = cutToEdge(designOf(TERRACE), drawn);
    expect(ringAreaM2(cut ?? [])).toBeCloseTo(4 * 8, 6);
    expect(cut).toContainEqual(p(10, 0));
  });

  it('a bar across a roof that a cut would leave in two pieces: no Cut to edge', () => {
    const across = box(-2, 3, 14, 2);
    expect(meet(across, designOf(TERRACE)).choices).toEqual(['upper_floor', 'open_shed']);
    expect(cutToEdge(designOf(TERRACE), across)).toBeNull();
  });

  it('across two roofs: it is counted from the highest under it and belongs to the one it covers most', () => {
    const low = roofOf('low', box(0, 0, 6, 10));
    const high = roofOf('high', box(8, 0, 6, 10), { height: { metres: 6, setBy: 'person' } });
    // 5 m over the low roof, 2 m over the high one.
    const met = meet(box(1, 2, 9, 4), designOf(low, high));
    expect(met).toMatchObject({ place: 'partly_over', on: 1, partOf: 0 });
  });

  it('a stair room on an upper floor lies in that floor, whatever is under it', () => {
    const upper = kindOf('upper', 'upper_floor', box(4, 0, 6, 4), { on: 'terrace' });
    const met = meet(box(5, 1, 3, 2), designOf(TERRACE, upper));
    expect(met).toMatchObject({
      place: 'inside',
      kind: 'stair_room',
      on: 1,
      partOf: null,
      startsLike: 1,
    });
  });

  it('a duct drawn under an open shed is a hole in the walled roof beneath: a shed is a cover, not a floor', () => {
    const tin = kindOf('tin', 'open_shed', box(-0.5, -0.5, 11, 9), { on: 'terrace' });
    const met = meet(box(6, 5, 1, 1), designOf(TERRACE, tin));
    expect(met).toMatchObject({ place: 'inside', kind: 'hole', on: 0 });
  });

  it('under an open shed with no roof beneath, it lies in the shed', () => {
    const yard = kindOf('yard', 'open_shed', box(20, 0, 8, 8));
    expect(meet(box(22, 2, 2, 2), designOf(TERRACE, yard))).toMatchObject({
      place: 'inside',
      on: 1,
    });
  });

  it('half on an upper floor and half on the terrace beside it: partly over, counted from the floor', () => {
    const upper = kindOf('upper', 'upper_floor', box(4, 0, 6, 4), { on: 'terrace' });
    const met = meet(box(5, 3, 2, 2), designOf(TERRACE, upper));
    expect(met).toMatchObject({ place: 'partly_over', on: 1 });
  });

  it('a new roof starts like the roof it lies on or meets, and like none when it stands apart', () => {
    expect(meet(box(0, 0, 3, 3)).startsLike).toBe(0);
    expect(meet(box(14, 2, 5, 4)).startsLike).toBe(1);
    expect(meet(box(-0.5, -0.5, 11, 9), designOf(TERRACE)).startsLike).toBe(0);
    expect(meet(box(30, 0, 5, 5)).startsLike).toBeNull();
  });
});

describe('how high each roof stands', () => {
  const DUCT = kindOf('duct', 'hole', box(6, 5, 1, 1), { partOf: 'terrace' });
  const design = designOf(
    TERRACE,
    stairOn(box(0, 0, 3, 3)),
    kindOf('upper', 'upper_floor', box(4, 0, 6, 4), { on: 'terrace' }),
    kindOf('tin', 'open_shed', box(3, 4, 4, 4), { on: 'terrace' }),
    kindOf('yard', 'open_shed', box(20, 0, 4, 4)),
    DUCT,
    kindOf('tank', 'upper_floor', box(1, 1, 1, 1), {
      on: 'stair',
      height: { metres: 1.2, setBy: 'person' },
    }),
  );

  it.each([
    ['a building: a storey up', 0, 3, 3],
    ['a stair room: the market’s stair-room height above its roof', 1, 3, 6],
    ['an upper floor: a storey above its roof', 2, 3, 6],
    ['an open shed on a roof: the stair-room height above it', 3, 3, 6],
    ['an open shed on the ground: a storey high', 4, 3, 3],
    ['a hole: open down to the floor below', 5, 0, 0],
    ['a roof on a roof on a roof: each counted from the one under it', 6, 1.2, 7.2],
  ])('%s', (_why, index, own, floor) => {
    const roof = design.roofs[index];
    if (roof === undefined) throw new Error('no such roof');
    expect(roofOwnHeightM(design, roof, FACTS)).toBeCloseTo(own, 6);
    expect(roofFloorM(design, index, FACTS)).toBeCloseTo(floor, 6);
  });

  it('an upper floor moves when the roof it sits on changes height', () => {
    const raised = designOf(
      { ...TERRACE, height: { metres: 4.5, setBy: 'person' } },
      stairOn(box(0, 0, 3, 3)),
    );
    expect(roofFloorM(raised, 1, FACTS)).toBeCloseTo(7.5, 6);
  });

  it('a stair room stands the market’s stair-room height, not its storey', () => {
    expect(roofFloorM(design, 1, { ...FACTS, stairRoomHeightM: 2.4 })).toBeCloseTo(5.4, 6);
    // An open shed on a roof stands as high as a stair room does.
    expect(roofFloorM(design, 3, { ...FACTS, stairRoomHeightM: 2.4 })).toBeCloseTo(5.4, 6);
  });

  it('a market with a plinth lifts every roof on the ground by it', () => {
    expect(roofFloorM(design, 1, { ...FACTS, plinthHeightM: 0.45 })).toBeCloseTo(6.45, 6);
  });

  it('the screens and the rules take a ground roof’s first height from one place', () => {
    const raised = { ...IN_FORMATS, roof: { ...IN_FORMATS.roof, plinthHeightM: 0.45 } };
    const facts = { ...raised.roof, storeyHeightM: raised.storeyHeightM };
    expect(groundRoofHeightM(raised)).toBeCloseTo(3.45, 6);
    expect(roofHeightOf(TERRACE, groundRoofHeightM(raised)).metres).toBe(
      roofFloorM(design, 0, facts),
    );
  });

  it('a hole under a second floor is open down to the floor below it', () => {
    const tall = designOf({ ...TERRACE, height: { metres: 6, setBy: 'person' } }, DUCT);
    expect(roofFloorM(tall, 1, FACTS)).toBeCloseTo(3, 6);
  });
});
