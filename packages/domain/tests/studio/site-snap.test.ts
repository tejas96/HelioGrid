import { describe, expect, it } from 'vitest';
import type { GroundPoint } from '../../src/studio/ground';
import { outlineCorners } from '../../src/studio/outline-corners';
import { snapTargetsOf, withSiteTargets } from '../../src/studio/roof-snap';
import { linesCross, linesNear, wallLinesOf } from '../../src/studio/roof-snap-lines';
import { drawing, drawTargetsOf } from '../../src/studio/roof-step-draw';
import { OUTLINE_TRUE_M, siteSnapTargets } from '../../src/studio/site-snap';
import { box, designOf, TERRACE } from './roof-meet-support';

/**
 * The magnet knows the site's buildings (`T-M05-002`, part g): each outline the height map traced
 * is corners and walls to pull to, a wall where the roof falls to the ground is its eave, and a
 * drawing pulls to them beside the design's own roofs.
 */

const HOUSE = box(20, 0, 12, 10);
const [CORNER_A, CORNER_B] = HOUSE as [GroundPoint, GroundPoint, ...GroundPoint[]];
const EAVE = { from: CORNER_A, to: CORNER_B, building: 0 };

/** A wall traced a metre at a time, every other step 0.3 m inside it; its end left to the next. */
function wobbly(from: GroundPoint, to: GroundPoint): GroundPoint[] {
  const length = Math.hypot(to.east - from.east, to.north - from.north);
  const way = { east: (to.east - from.east) / length, north: (to.north - from.north) / length };
  return Array.from({ length }, (_, i) => {
    const inside = i % 2 === 0 ? 0 : 0.3;
    return {
      east: from.east + way.east * i - way.north * inside,
      north: from.north + way.north * i + way.east * inside,
    };
  });
}

describe('the site’s buildings as magnet targets', () => {
  it('each corner and wall of an outline; the wall that is an eave is owned by the eave', () => {
    const targets = siteSnapTargets({ outlines: [HOUSE], eaves: [EAVE] });
    expect(targets.corners).toHaveLength(4);
    expect(targets.corners[0]?.owner).toEqual({ kind: 'building', building: 0 });
    expect(targets.edges.map((edge) => edge.owner.kind)).toEqual([
      'eave',
      'building',
      'building',
      'building',
    ]);
  });

  it.each([
    [
      'an eave along the wall, a little short of its ends, is the wall’s',
      { from: { east: 21, north: 0.05 }, to: { east: 31, north: 0.05 } },
      'eave',
    ],
    [
      'one a metre off the wall is not',
      { from: { east: 20, north: 1 }, to: { east: 32, north: 1 } },
      'building',
    ],
    [
      'one across the wall is not',
      { from: { east: 26, north: -3 }, to: { east: 26, north: 3 } },
      'building',
    ],
  ])('%s', (_, line, kind) => {
    const eave = { ...line, building: 0 };
    expect(siteSnapTargets({ outlines: [HOUSE], eaves: [eave] }).edges[0]?.owner.kind).toBe(kind);
  });

  it('a traced outline that steps along its walls is kept to the house’s four corners', () => {
    // A 12 m × 10 m house traced cell by cell: its walls wobble 0.3 m, a corner every metre.
    const steps = [
      ...wobbly({ east: 0, north: 0 }, { east: 12, north: 0 }),
      ...wobbly({ east: 12, north: 0 }, { east: 12, north: 10 }),
      ...wobbly({ east: 12, north: 10 }, { east: 0, north: 10 }),
      ...wobbly({ east: 0, north: 10 }, { east: 0, north: 0 }),
    ];
    const corners = outlineCorners(steps, OUTLINE_TRUE_M);
    expect(corners).toHaveLength(4);
    expect(siteSnapTargets({ outlines: [steps], eaves: [] }).corners).toHaveLength(4);
  });

  it('a building’s wall holds a spot on itself, never on its line past its ends', () => {
    const site = siteSnapTargets({ outlines: [HOUSE], eaves: [] });
    const around = { points: [{ east: 40, north: 0 }], within: 50 };
    const walls = wallLinesOf(site, around);
    // 8 m east of the house's south-east corner, right on its south wall's line.
    expect(linesNear({ east: 40, north: 0 }, walls, 0.5).near).toEqual([]);
    expect(linesNear({ east: 26, north: 0.2 }, walls, 0.5).near).toHaveLength(1);
  });

  it('two buildings’ wall lines crossing in the street are no corner to snap to', () => {
    const other = box(40, 20, 6, 6);
    const site = siteSnapTargets({ outlines: [HOUSE, other], eaves: [] });
    const walls = wallLinesOf(site, { points: [{ east: 40, north: 0 }], within: 100 });
    const south = walls.find((w) => w.guide.through.north === 0 && w.guide.through.east === 20);
    const west = walls.find(
      (w) => w.guide.through.east === 40 && Math.abs(w.guide.way.east) < 0.01,
    );
    if (south === undefined || west === undefined) throw new Error('walls not found');
    expect(linesCross(south, west)).toBeNull();
  });

  it('a drawing pulls to the design’s roofs and then the site’s buildings; with none, its roofs alone', () => {
    const site = siteSnapTargets({ outlines: [HOUSE], eaves: [] });
    const document = designOf(TERRACE);
    const plain = drawing(true);
    if (plain.kind !== 'drawing') throw new Error('not drawing');
    expect(drawTargetsOf(plain, document)).toEqual(snapTargetsOf(document.roofs));
    const withSite = drawTargetsOf({ ...plain, site }, document);
    expect(withSite.corners).toHaveLength(8);
    expect(withSite.corners[4]?.owner.kind).toBe('building');
    expect(withSiteTargets(snapTargetsOf(document.roofs), undefined)).toEqual(
      snapTargetsOf(document.roofs),
    );
  });
});
