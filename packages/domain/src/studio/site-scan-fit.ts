import type { Roof } from './document';
import type { GroundPoint } from './ground';
import type { BuildingScanFit } from './roof-buildings';
import { pointInside } from './roof-shape';
import type { SiteBuilding, SiteLineUp } from './site-data';
import { ringBox } from './site-grid';
import { roofDataReadsOf, roofScanRangeOf, type SiteGrids } from './site-roof-reads';

/**
 * Where the scan sees each drawn building (`T-M05-002g`): the one shift, within 5 m of where it
 * stands, that puts the most of its roofs on the scan's building outlines, with the map where the
 * line-up laid it — so a roof traced on the leaning sky picture finds its true spot. Worked in the
 * studio's Web Worker: a campus asks it of every building at once.
 */

/** A building is looked for this far round where it stands, first in half metres, then in 10 cm. */
export const SCAN_REACH_M = 5;
const COARSE_STEP_M = 0.5;
const FINE_STEP_M = 0.1;
/** The roofs are sampled on a grid this fine. */
const SAMPLE_M = 0.5;
/** A shift must cover this much more than where it stands, and move it this far, to be one. */
const BETTER_BY = 1.05;
const MOVE_MIN_M = 0.1;
const CM = 100;

interface Outline {
  readonly ring: readonly GroundPoint[];
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

/** The sample points inside a building's roofs. */
function samplesOf(roofs: readonly Pick<Roof, 'corners'>[]): GroundPoint[] {
  const points: GroundPoint[] = [];
  for (const { corners } of roofs) {
    const box = ringBox(corners);
    for (let east = box.west + SAMPLE_M / 2; east < box.east; east += SAMPLE_M) {
      for (let north = box.south + SAMPLE_M / 2; north < box.north; north += SAMPLE_M) {
        const point = { east, north };
        if (pointInside(point, corners)) points.push(point);
      }
    }
  }
  return points;
}

/** How many of the points, moved by `shift`, fall on the scan's buildings. */
function coverAt(points: readonly GroundPoint[], outlines: readonly Outline[], shift: GroundPoint) {
  let count = 0;
  for (const point of points) {
    const east = point.east + shift.east;
    const north = point.north + shift.north;
    for (const outline of outlines) {
      if (
        east < outline.west ||
        east > outline.east ||
        north < outline.south ||
        north > outline.north
      )
        continue;
      if (pointInside({ east, north }, outline.ring)) {
        count += 1;
        break;
      }
    }
  }
  return count;
}

const toCm = (metres: number) => Math.round(metres * CM) / CM;

interface Tried extends GroundPoint {
  readonly cover: number;
}

/** Every shift on a square of `reach` round `middle`, `step` apart, within the scan's reach. */
function shiftsRound(middle: GroundPoint, reach: number, step: number): GroundPoint[] {
  const steps = Math.round(reach / step);
  const shifts: GroundPoint[] = [];
  for (let i = -steps; i <= steps; i += 1) {
    for (let j = -steps; j <= steps; j += 1) {
      const shift = { east: middle.east + i * step, north: middle.north + j * step };
      if (Math.hypot(shift.east, shift.north) <= SCAN_REACH_M + 1e-9) shifts.push(shift);
    }
  }
  return shifts;
}

/**
 * The shift that covers the most: the middle of those that tie, so a roof sits centred on its
 * building; where that middle falls between two places, the tied shift nearest it.
 */
function bestOf(tried: readonly Tried[], coverOf: (shift: GroundPoint) => number): Tried {
  const most = Math.max(0, ...tried.map((one) => one.cover));
  const tied = tried.filter((one) => one.cover === most && most > 0);
  if (tied.length === 0) return { east: 0, north: 0, cover: 0 };
  const centre = {
    east: tied.reduce((sum, one) => sum + one.east, 0) / tied.length,
    north: tied.reduce((sum, one) => sum + one.north, 0) / tied.length,
  };
  if (coverOf(centre) >= most) return { ...centre, cover: most };
  const away = (one: GroundPoint) => Math.hypot(one.east - centre.east, one.north - centre.north);
  return tied.reduce((a, b) => (away(b) < away(a) ? b : a));
}

/** The best shift for one building's sample points; `null` where none beats where it stands. */
function scanShiftOf(
  points: readonly GroundPoint[],
  outlines: readonly Outline[],
): GroundPoint | null {
  const coverOf = (shift: GroundPoint) => coverAt(points, outlines, shift);
  const here = coverOf({ east: 0, north: 0 });
  const tryAll = (shifts: readonly GroundPoint[]) =>
    shifts.map((shift) => ({ ...shift, cover: coverOf(shift) }));
  const coarse = bestOf(
    tryAll(shiftsRound({ east: 0, north: 0 }, SCAN_REACH_M, COARSE_STEP_M)),
    coverOf,
  );
  const best = bestOf(tryAll(shiftsRound(coarse, COARSE_STEP_M, FINE_STEP_M)), coverOf);
  const far = Math.hypot(best.east, best.north);
  if (best.cover <= here * BETTER_BY || best.cover === 0 || far < MOVE_MIN_M) return null;
  return { east: toCm(best.east), north: toCm(best.north) };
}

/**
 * Each building's fit: its shift onto the scan, and what the height map reads in each of its roofs
 * there. `buildings` holds each building's roofs on the ground (which the outline search uses) and
 * all its roofs (which are read).
 */
export function scanFitsOf(input: {
  readonly buildings: readonly {
    readonly ground: readonly Pick<Roof, 'id' | 'corners'>[];
    readonly members: readonly Pick<Roof, 'id' | 'corners'>[];
  }[];
  readonly outlines: readonly SiteBuilding['outline'][];
  readonly grids: SiteGrids;
  readonly lineUp: SiteLineUp;
}): BuildingScanFit[] {
  const { lineUp } = input;
  const outlines: Outline[] = input.outlines.map((outline) => {
    const ring = outline.map((p) => ({
      east: p.east + lineUp.east,
      north: p.north + lineUp.north,
    }));
    return { ring, ...ringBox(ring) };
  });
  return input.buildings.map((building) => {
    const shift = outlines.length === 0 ? null : scanShiftOf(samplesOf(building.ground), outlines);
    const by = shift ?? { east: 0, north: 0 };
    const placed = building.members.map((roof) => ({
      id: roof.id,
      corners: roof.corners.map((c) => ({ east: c.east + by.east, north: c.north + by.north })),
    }));
    const ranges = Object.fromEntries(
      placed.flatMap((roof) => {
        const range = roofScanRangeOf(roof.corners, input.grids, lineUp);
        return range === null ? [] : [[roof.id, range]];
      }),
    );
    return { shift, reads: roofDataReadsOf(placed, input.grids, lineUp), ranges };
  });
}
