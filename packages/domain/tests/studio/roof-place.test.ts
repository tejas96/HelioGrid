import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { meetingOf } from '../../src/studio/roof-meet';
import { roofMadeInto, roofPlaced } from '../../src/studio/roof-place';
import { box, designOf, FACTS, kindOf, p, roofOf, SHED, TERRACE } from './roof-meet-support';

/**
 * A roof takes its place among the others (`T-M05-002`, part e): from how it meets them when it
 * closes, and from the kind a person picks after. Only that roof changes.
 */
const RCC = { type: 'rcc', setBy: 'person', confirmed: true } as const;
const HOME = { ...TERRACE, material: RCC };
const HOUSE = designOf(HOME, SHED);
const drawn = (corners: ReturnType<typeof box>, more: Partial<Roof> = {}) =>
  roofOf('new', corners, more);
const placed = (corners: ReturnType<typeof box>, design = HOUSE, more: Partial<Roof> = {}) => {
  const roof = drawn(corners, more);
  return roofPlaced(design, roof, meetingOf(design, roof.corners, FACTS), FACTS);
};
const UNCONFIRMED = { setBy: 'system', confirmed: false };

describe('a roof just closed takes its place', () => {
  it('a stair room on the terrace: the studio’s guess, standing on it, made of what it is made of', () => {
    expect(placed(box(0, 0, 3, 3))).toEqual({
      ...drawn(box(0, 0, 3, 3)),
      kind: { is: 'stair_room', setBy: 'system' },
      on: 'terrace',
      material: { type: 'rcc', ...UNCONFIRMED },
    });
  });

  it('a duct: a hole is part of its roof and stands on none', () => {
    const duct = placed(box(6, 5, 1, 1));
    expect(duct).toMatchObject({ kind: { is: 'hole', setBy: 'system' }, partOf: 'terrace' });
    expect(Object.keys(duct)).not.toContain('on');
  });

  it('a dormer stands on the sloped roof it is drawn in', () => {
    expect(placed(box(11, 2, 1.5, 2))).toMatchObject({ kind: { is: 'dormer' }, on: 'shed' });
  });

  it('a tin shed over the whole terrace: an open shed of the market’s first sheet, to be confirmed', () => {
    expect(placed(box(-0.5, -0.5, 11, 9), designOf(HOME))).toMatchObject({
      kind: { is: 'open_shed', setBy: 'system' },
      on: 'terrace',
      material: { type: 'trapezoidal_sheet', ...UNCONFIRMED },
    });
  });

  it('across two roofs: it stands on the highest under it and belongs to the one it covers most', () => {
    const low = roofOf('low', box(0, 0, 6, 10));
    const high = roofOf('high', box(8, 0, 6, 10), { height: { metres: 6, setBy: 'person' } });
    expect(placed(box(1, 2, 9, 4), designOf(low, high))).toMatchObject({
      on: 'high',
      partOf: 'low',
    });
  });

  it('beside the others: a building, with no kind stored and no link, made of what its neighbour is', () => {
    const beside = placed(box(14, 2, 5, 4));
    expect(Object.keys(beside).sort()).toEqual([
      'corners',
      'edges',
      'height',
      'id',
      'material',
      'tracedOn',
    ]);
    expect(beside.material).toEqual({ type: 'trapezoidal_sheet', ...UNCONFIRMED });
  });

  it('apart from every roof: nothing is stored but its outline', () => {
    expect(placed(box(30, 0, 5, 5))).toEqual(drawn(box(30, 0, 5, 5)));
  });

  it('a roof beside one with no material stored starts with none stored, as that one does', () => {
    expect(Object.keys(placed(box(0, 8, 6, 4), designOf(TERRACE)))).not.toContain('material');
  });

  it('a roof drawn 0.2 m inside the wall takes the corners moved onto it', () => {
    const stair = placed(box(0.2, 0.2, 3, 3));
    expect(stair.corners[0]).toEqual(p(0, 0));
    expect(stair.edges).toHaveLength(stair.corners.length);
  });

  it('a typed roof keeps its true size: its corners are never moved to meet a neighbour', () => {
    const typed = placed(box(10.2, 0, 4, 8), designOf(HOME), {
      edges: ['typed', 'typed', 'typed', 'typed'],
    });
    expect(typed.corners).toEqual(box(10.2, 0, 4, 8));
    expect(typed.edges).toEqual(['typed', 'typed', 'typed', 'typed']);
  });

  it('a roof already standing never changes because a new one was placed', () => {
    const before = JSON.stringify(HOUSE);
    placed(box(-1, -1, 16, 10));
    expect(JSON.stringify(HOUSE)).toBe(before);
  });
});

describe('a person makes a roof another kind', () => {
  const stair = placed(box(0, 0, 3, 3));
  const design = designOf(HOME, SHED, stair);
  const made = (kind: Parameters<typeof roofMadeInto>[2], from = design, index = 2) =>
    roofMadeInto(from, index, kind, FACTS).roofs[index] as Roof;

  it('a stair room made a hole: cut in the roof it stood on, and now a person’s', () => {
    const hole = made('hole');
    expect(hole).toMatchObject({ kind: { is: 'hole', setBy: 'person' }, partOf: 'terrace' });
    expect(Object.keys(hole)).not.toContain('on');
  });

  it('a hole made a stair room stands on the roof it was cut in', () => {
    const back = made('stair_room', designOf(HOME, SHED, made('hole')));
    expect(back).toMatchObject({ kind: { is: 'stair_room', setBy: 'person' }, on: 'terrace' });
    expect(Object.keys(back)).not.toContain('partOf');
  });

  it('made a separate part: carved out of that roof, and standing on none', () => {
    const part = made('separate_part');
    expect(part).toMatchObject({ partOf: 'terrace' });
    expect(Object.keys(part)).not.toContain('on');
  });

  it('made a building: it stands on the ground, tied to no roof', () => {
    const building = made('building');
    expect(Object.keys(building)).not.toContain('on');
    expect(Object.keys(building)).not.toContain('partOf');
  });

  it('made an open shed: the market’s first sheet, where the studio gave its material', () => {
    expect(made('open_shed').material).toEqual({ type: 'trapezoidal_sheet', ...UNCONFIRMED });
  });

  it('a material and a height a person set stay when the kind changes; the studio’s go back to the kind’s own', () => {
    const mine = {
      ...stair,
      material: { type: 'slate', setBy: 'person', confirmed: true } as const,
      height: { metres: 2.4, setBy: 'person' } as const,
    };
    const shed = made('open_shed', designOf(HOME, SHED, mine));
    expect(shed.material).toEqual(mine.material);
    expect(shed.height).toEqual(mine.height);
    const system = { ...stair, height: { metres: 3, setBy: 'system' } as const };
    expect(made('upper_floor', designOf(HOME, SHED, system)).height).toBeNull();
  });

  it('an upper floor across two roofs keeps both its links when made an open shed', () => {
    const across = kindOf('across', 'upper_floor', box(8, 2, 4, 4), {
      on: 'shed',
      partOf: 'terrace',
    });
    expect(made('open_shed', designOf(HOME, SHED, across))).toMatchObject({
      on: 'shed',
      partOf: 'terrace',
    });
  });

  it('picking the kind the studio guessed makes the guess the person’s, once: again it changes nothing', () => {
    const mine = roofMadeInto(design, 2, 'stair_room', FACTS);
    expect(mine.roofs[2]?.kind).toEqual({ is: 'stair_room', setBy: 'person' });
    expect(roofMadeInto(mine, 2, 'stair_room', FACTS)).toBe(mine);
    expect(roofMadeInto(design, 9, 'hole', FACTS)).toBe(design);
  });

  it('only that roof changes', () => {
    const after = roofMadeInto(design, 2, 'hole', FACTS);
    expect(after.roofs.slice(0, 2)).toEqual(design.roofs.slice(0, 2));
  });
});
