import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT, type Roof, type StudioDocument } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { faultOf } from '../../src/studio/roof-check';
import { cornerDragged } from '../../src/studio/roof-edit';
import { roofMoved } from '../../src/studio/roof-move';

/**
 * No roof is refused for lying over another (`T-M05-002`, part e): a stair room on its roof, a hole
 * in one, an open shed over one, an upper floor that sticks out, and two buildings a person drags
 * together. A roof's own shape and the site's reach are still checked.
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

describe('no roof is refused for lying over another', () => {
  it.each([
    ['a stair room on its roof', 1],
    ['an upper floor on the stair room', 2],
    ['a hole in its roof', 3],
  ])('%s is never refused for lying over it', (_why, index) => {
    const roof = HOUSE.roofs[index] as Roof;
    expect(faultOf(roof.corners)).toBeNull();
    expect(cornerDragged(HOUSE, index, 2, p(4, 4), false).fault).toBeNull();
  });

  it('the roof under a stair room is not refused for what stands on it', () => {
    expect(faultOf(TERRACE.corners)).toBeNull();
    expect(cornerDragged(HOUSE, 0, 2, p(10, 9), false).fault).toBeNull();
  });

  it('an open shed over a roof is not refused, though it stands on none', () => {
    const over = roofOf('over', box(-1, -1, 12, 10), {
      kind: { is: 'open_shed', setBy: 'system' },
    });
    const _design = designOf(TERRACE, over);
    expect(faultOf(over.corners)).toBeNull();
    expect(faultOf(TERRACE.corners)).toBeNull();
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

  it('two buildings on the ground may lie over each other too: what they are is the roof step’s to say', () => {
    expect(roofMoved(HOUSE, 4, p(-2, 0)).fault).toBeNull();
    expect(roofMoved(HOUSE, 0, p(2, 0)).fault).toBeNull();
  });

  it.each([
    ['a corner past the site’s reach', p(2_001, 0), 'too_far'],
    ['edges that cross', p(4, -3), 'would_cross'],
  ])('a roof’s own shape is still checked: %s', (_why, to, fault) => {
    expect(cornerDragged(designOf(TERRACE), 0, 2, to, false).fault).toBe(fault);
  });
});
