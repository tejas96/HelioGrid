import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT, type Roof, type StudioDocument } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { faultOf } from '../../src/studio/roof-check';
import { cornerDragged } from '../../src/studio/roof-edit';
import { roofMoved } from '../../src/studio/roof-move';

/**
 * The touching check of the release before part e's screens (`T-M05-002`, part e): two buildings on
 * the ground never overlap, and a roof that stands on another, is part of one or is an open shed is
 * never refused for where it lies — so a design a later studio saved stays editable here.
 */
const p = (east: number, north: number): GroundPoint => ({ east, north });
const box = (west: number, south: number, wide: number, deep: number) => [
  p(west, south),
  p(west + wide, south),
  p(west + wide, south + deep),
  p(west, south + deep),
];
const roofOf = (id: string, corners: readonly GroundPoint[], more: Partial<Roof> = {}): Roof => ({
  id,
  corners,
  edges: corners.map(() => 'traced'),
  tracedOn: 'sky',
  height: null,
  ...more,
});
const designOf = (...roofs: Roof[]): StudioDocument => ({ ...EMPTY_STUDIO_DOCUMENT, roofs });
const TERRACE = roofOf('terrace', box(0, 0, 10, 8));
const STAIR = roofOf('stair', box(0, 0, 3, 3), {
  kind: { is: 'stair_room', setBy: 'system' },
  on: 'terrace',
});
const TANK_ROOM = roofOf('tank', box(1, 1, 1, 1), {
  kind: { is: 'upper_floor', setBy: 'person' },
  on: 'stair',
});
const DUCT = roofOf('duct', box(6, 5, 1, 1), {
  kind: { is: 'hole', setBy: 'person' },
  partOf: 'terrace',
});
const SHED = roofOf('shed', box(10, 0, 4, 8));
const HOUSE = designOf(TERRACE, STAIR, TANK_ROOM, DUCT, SHED);

describe('the touching check knows how roofs relate', () => {
  it.each([
    ['a stair room on its roof', 1],
    ['an upper floor on the stair room', 2],
    ['a hole in its roof', 3],
  ])('%s is never refused for lying over it', (_why, index) => {
    const roof = HOUSE.roofs[index] as Roof;
    expect(faultOf(HOUSE, index, roof.corners)).toBeNull();
    expect(cornerDragged(HOUSE, index, 2, p(4, 4), false).fault).toBeNull();
  });

  it('the roof under a stair room is not refused for what stands on it', () => {
    expect(faultOf(HOUSE, 0, TERRACE.corners)).toBeNull();
    expect(cornerDragged(HOUSE, 0, 2, p(10, 9), false).fault).toBeNull();
  });

  it('an open shed over a roof is not refused, though it stands on none', () => {
    const over = roofOf('over', box(-1, -1, 12, 10), {
      kind: { is: 'open_shed', setBy: 'system' },
    });
    const design = designOf(TERRACE, over);
    expect(faultOf(design, 1, over.corners)).toBeNull();
    expect(faultOf(design, 0, TERRACE.corners)).toBeNull();
  });

  it('a roof of a kind a later studio added, standing on another, is not refused either', () => {
    const later = roofOf('later', box(2, 2, 3, 3), {
      kind: { is: 'water_tank_room', setBy: 'person' },
      on: 'terrace',
    });
    const design = designOf(TERRACE, later);
    expect(roofMoved(design, 1, p(1, 1)).fault).toBeNull();
    expect(cornerDragged(design, 0, 2, p(10, 9), false).fault).toBeNull();
  });

  it('two buildings on the ground still never overlap', () => {
    expect(roofMoved(HOUSE, 4, p(-2, 0)).fault).toBe('would_overlap');
    expect(roofMoved(HOUSE, 0, p(2, 0)).fault).toBe('would_overlap');
  });

  it('a building of a kind a later studio added is kept clear of others, as a building is', () => {
    const later = roofOf('later', box(10, 0, 4, 8), { kind: { is: 'carport', setBy: 'person' } });
    expect(roofMoved(designOf(TERRACE, later), 1, p(-2, 0)).fault).toBe('would_overlap');
  });
});
