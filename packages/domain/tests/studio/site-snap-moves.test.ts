import { describe, expect, it } from 'vitest';
import { heldPlaced } from '../../src/studio/roof-corner-magnet';
import { heightPullOf } from '../../src/studio/roof-height-magnet';
import { roofMoved } from '../../src/studio/roof-move';
import { snapTargetsOf, withSiteTargets } from '../../src/studio/roof-snap';
import { cornerLinesOf, wallLinesOf } from '../../src/studio/roof-snap-lines';
import { siteSnapTargets } from '../../src/studio/site-snap';
import { box, designOf, FACTS, roofOf, TERRACE } from './roof-meet-support';

/**
 * A building's walls hold on themselves alone (`T-M05-002`, part g), and every other pull keeps
 * working with them: a moved roof slides into a building's corner, a typed length meets a
 * building's wall only on it, a roof's own line-up is kept along a building's line, and an eave
 * pull lands on the height slider's step.
 */

const REACH = 0.5;

describe('the magnet beside the site’s buildings', () => {
  it('a roof moved against a building’s wall slides along it into the building’s corner', () => {
    const site = siteSnapTargets({ outlines: [box(10, 0, 6, 6)], eaves: [] });
    const moved = roofMoved(
      designOf(roofOf('r', box(0, 0, 4, 4))),
      0,
      { east: 5.9, north: 0.2 },
      [],
      REACH,
      site,
    );
    const corners = moved.document.roofs[0]?.corners ?? [];
    expect(corners.some((c) => Math.abs(c.east - 10) < 1e-6 && Math.abs(c.north) < 1e-6)).toBe(
      true,
    );
  });

  it('a typed length meets a building’s wall on the wall, never on its line past the end', () => {
    const document = designOf(roofOf('r', box(0, 0, 10, 10)));
    const site = siteSnapTargets({ outlines: [box(20.3, 0, 10, 5)], eaves: [] });
    const corners = document.roofs[0]?.corners ?? [];
    // Held 10 m from (10, 0); the building's south wall runs on that line from 20.3 m, within reach.
    const placed = heldPlaced(corners, 0, true, { east: 20, north: 0.3 }, true, {
      document,
      roofIndex: 0,
      reach: REACH,
      site,
    });
    expect(placed.snap?.kind).toBe('held');
  });

  it('a roof’s corner lines up along a building’s wall line past the wall’s ends', () => {
    const diamond = roofOf('d', [
      { east: 5, north: 0 },
      { east: 10, north: 5 },
      { east: 5, north: 10 },
      { east: 0, north: 5 },
    ]);
    const targets = withSiteTargets(
      snapTargetsOf([diamond]),
      siteSnapTargets({ outlines: [box(20, 5, 6, 4)], eaves: [] }),
    );
    const near = { points: [{ east: 15, north: 5 }], within: 20 };
    const walls = wallLinesOf(targets, near);
    const lines = cornerLinesOf(targets, { east: 1, north: 0 }, walls, near);
    expect(
      lines.some(
        (line) =>
          line.hold.kind === 'lines_up_with' &&
          Math.abs(line.guide.way.north) < 1e-6 &&
          Math.abs(line.guide.through.north - 5) < 1e-6,
      ),
    ).toBe(true);
  });

  it('a height pulled to a measured eave lands on the slider’s 10 cm step', () => {
    const eave = { from: { east: 12, north: 0 }, to: { east: 12, north: 8 }, heightM: 7.23 };
    const pull = heightPullOf(designOf(TERRACE), 0, FACTS, 7.25, undefined, {
      eaves: [eave],
      mapM: null,
    });
    expect(pull?.to.kind).toBe('eave');
    expect(pull?.metres).toBeCloseTo(7.2, 9);
  });
});
