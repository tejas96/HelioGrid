import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { RoofFacts } from './roof-levels';
import { type EdgeStretch, parapetNow } from './roof-open-edges';
import type { ScenePrism } from './roof-scene';

/**
 * A roof's parapets as solids (`T-M05-002`, part e): one along each stretch of a side that has a
 * wall, with its own height and the parapet's thickness, on the roof's side of the outline — or
 * outside it where the lengths were measured inside the walls. A railing is posts and a rail.
 */

/** A railing's post and its rail are this thick, and its posts at most this far apart, in metres. */
const RAIL_M = 0.05;
const RAIL_POSTS_M = 1.5;

interface Line {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
}

const along = (line: Line, share: number): GroundPoint => ({
  east: line.from.east + (line.to.east - line.from.east) * share,
  north: line.from.north + (line.to.north - line.from.north) * share,
});

const lengthOf = (line: Line) =>
  Math.hypot(line.to.east - line.from.east, line.to.north - line.from.north);

/** A strip of ground beside a line, `wide` metres to its left for a positive width. */
function strip(line: Line, wide: number, before = 0, after = 0): GroundPoint[] {
  const length = lengthOf(line) || 1;
  const ahead = {
    east: (line.to.east - line.from.east) / length,
    north: (line.to.north - line.from.north) / length,
  };
  const left = { east: -ahead.north * wide, north: ahead.east * wide };
  const from = {
    east: line.from.east - ahead.east * before,
    north: line.from.north - ahead.north * before,
  };
  const to = {
    east: line.to.east + ahead.east * after,
    north: line.to.north + ahead.north * after,
  };
  const ring = [
    from,
    to,
    { east: to.east + left.east, north: to.north + left.north },
    { east: from.east + left.east, north: from.north + left.north },
  ];
  // A strip to the right of its line runs clockwise: turned, every solid's outline runs one way.
  return wide < 0 ? ring.reverse() : ring;
}

/** Whether an outline runs anticlockwise seen from above. */
export function turnsLeft(corners: readonly GroundPoint[]): boolean {
  const twice = corners.reduce((sum, at, i) => {
    const next = corners[(i + 1) % corners.length] as GroundPoint;
    return sum + at.east * next.north - next.east * at.north;
  }, 0);
  return twice >= 0;
}

/** Whether the outline turns away from its inside at a corner: an inner corner of an L. */
function reflexAt(
  corners: readonly GroundPoint[],
  corner: number,
  anticlockwise: boolean,
): boolean {
  const count = corners.length;
  const before = corners[(corner - 1 + count) % count] as GroundPoint;
  const at = corners[corner] as GroundPoint;
  const after = corners[(corner + 1) % count] as GroundPoint;
  const cross =
    (at.east - before.east) * (after.north - at.north) -
    (at.north - before.north) * (after.east - at.east);
  return anticlockwise ? cross < 0 : cross > 0;
}

/** A railing along a stretch: a post at each end and each 1.5 m between, and a rail on top. */
function railing(
  roof: number,
  line: Line,
  footM: number,
  metres: number,
  side: number,
): ScenePrism[] {
  const posts = Math.max(1, Math.ceil(lengthOf(line) / RAIL_POSTS_M));
  const solid = (outer: GroundPoint[], foot: number): ScenePrism => ({
    roof,
    part: 'rail',
    outer,
    holes: [],
    footM: foot,
    topM: footM + metres,
    top: 'plain',
  });
  const half = RAIL_M / lengthOf(line) / 2;
  const stands = Array.from({ length: posts + 1 }, (_, i) => {
    const at = Math.min(Math.max(i / posts, half), 1 - half);
    return solid(
      strip({ from: along(line, at - half), to: along(line, at + half) }, side * RAIL_M),
      footM,
    );
  });
  return [...stands, solid(strip(line, side * RAIL_M), footM + metres - RAIL_M)];
}

/**
 * The parapets of the roof at `index`, standing on `footM`. `roofSide` says which side of the
 * outline the roof lies on as the outline runs: a hole's roof lies outside its outline.
 */
export function parapetPrisms(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  footM: number,
  /** The roof's sides, each split where another roof takes it. */
  sides: readonly (readonly EdgeStretch[])[],
): ScenePrism[] {
  const roof = document.roofs[index] as Roof;
  const parapet = parapetNow(document, roof, facts);
  const corners = roof.corners;
  const anticlockwise = turnsLeft(corners);
  const hole = roof.kind?.is === 'hole';
  // A wall stands on the roof's side of the outline; measured inside, the outline is its inner face.
  const inward = anticlockwise ? 1 : -1;
  const onRoof = hole ? -inward : inward;
  const side = parapet.lengthsMeasured === 'inside' && !hole ? -onRoof : onRoof;
  return sides.flatMap((stretches, at) => {
    const whole: Line = {
      from: corners[at] as GroundPoint,
      to: corners[(at + 1) % corners.length] as GroundPoint,
    };
    return stretches.flatMap((stretch): ScenePrism[] => {
      if (!stretch.wall || stretch.metres <= 0) return [];
      const line: Line = { from: along(whole, stretch.from), to: along(whole, stretch.to) };
      if (parapet.build === 'railing') return railing(index, line, footM, stretch.metres, side);
      // Where the outline turns away from the wall's side, two walls would leave a notch: each runs on.
      const turnsAway = (corner: number) =>
        reflexAt(corners, corner, anticlockwise) === (side === inward);
      const before = stretch.from === 0 && turnsAway(at) ? parapet.thicknessM : 0;
      const after =
        stretch.to === 1 && turnsAway((at + 1) % corners.length) ? parapet.thicknessM : 0;
      return [
        {
          roof: index,
          part: 'parapet',
          outer: strip(line, side * parapet.thicknessM, before, after),
          holes: [],
          footM,
          topM: footM + stretch.metres,
          top: 'plain',
        },
      ];
    });
  });
}
