import type { GroundPoint } from './ground';
import { type HeightGrid, heightAt } from './site-grid';
import type { SunPathPoint } from './site-sun';

/**
 * The skyline a spot of the site sees (`T-M05-002`, part g): for each compass bearing, how high
 * the height map stands above the spot's eye, as an angle — the neighbours, the trees, the far side
 * of the street — with the far hills (PVGIS's horizon) laid under it. Where the sun's path dips
 * below the skyline the spot is in shade. The sun chart, the shade times and the sunlight view all
 * read this one skyline, so they agree.
 */

/** A skyline: the angle above the horizon at each bearing, `stepDeg` apart from north clockwise. */
export interface Skyline {
  readonly stepDeg: number;
  readonly elevationsDeg: readonly number[];
}

export interface Eye extends GroundPoint {
  /** Metres above the grid's datum. */
  readonly height: number;
}

/** The chart's skyline: one bearing every 2°. */
export const SKYLINE_STEP_DEG = 2;
/** The height map is read this far out along each bearing at most. */
const REACH_M = 150;
/** A spot's own roof cells are never its skyline: the march starts this far out. */
const START_M = 1;
const RADIANS = Math.PI / 180;
const DEGREES = 180 / Math.PI;
const TURN = 360;

/** The skyline of the height map from an eye: the steepest cell along each bearing. */
export function skylineAt(
  grid: HeightGrid,
  eye: Eye,
  stepDeg = SKYLINE_STEP_DEG,
  reachM = REACH_M,
): Skyline {
  const bearings = Math.round(TURN / stepDeg);
  const elevationsDeg: number[] = [];
  for (let i = 0; i < bearings; i += 1) {
    const bearing = i * stepDeg * RADIANS;
    const way = { east: Math.sin(bearing), north: Math.cos(bearing) };
    elevationsDeg.push(Math.atan(steepestAlong(grid, eye, way, reachM)) * DEGREES);
  }
  return { stepDeg, elevationsDeg };
}

/** The steepest rise from the eye to a cell along one way, to the grid's edge or `reachM`. */
function steepestAlong(grid: HeightGrid, eye: Eye, way: GroundPoint, reachM: number): number {
  const eastEnd = grid.west + grid.cols * grid.stepM;
  const northEnd = grid.south + grid.rows * grid.stepM;
  const step = grid.stepM / 2;
  let steepest = 0;
  for (let d = START_M; d <= reachM; d += step) {
    const spot = { east: eye.east + way.east * d, north: eye.north + way.north * d };
    const off =
      spot.east < grid.west ||
      spot.north < grid.south ||
      spot.east >= eastEnd ||
      spot.north >= northEnd;
    if (off) break;
    // A cell with no data reads NaN, which is never steeper.
    const slope = (heightAt(grid, spot) - eye.height) / d;
    if (slope > steepest) steepest = slope;
  }
  return steepest;
}

/** The skyline's angle at any bearing, between its two nearest. */
export function skylineAtBearing(skyline: Skyline, bearingDeg: number): number {
  const count = skyline.elevationsDeg.length;
  if (count === 0) return 0;
  const at = (((bearingDeg % TURN) + TURN) % TURN) / skyline.stepDeg;
  const below = Math.floor(at) % count;
  const above = (below + 1) % count;
  const t = at - Math.floor(at);
  return (
    (skyline.elevationsDeg[below] as number) * (1 - t) +
    (skyline.elevationsDeg[above] as number) * t
  );
}

/** The higher of two skylines at each of the first one's bearings: the near and the far. */
export function skylinesJoined(near: Skyline, far: Skyline | null): Skyline {
  if (far === null) return near;
  return {
    stepDeg: near.stepDeg,
    elevationsDeg: near.elevationsDeg.map((angle, i) =>
      Math.max(angle, skylineAtBearing(far, i * near.stepDeg)),
    ),
  };
}

/**
 * A far horizon read with its bearings counted from the south (PVGIS: 0 south, 90 west, −90 east),
 * as a skyline counted from the north, `stepDeg` apart.
 */
export function skylineFromSouthBearings(
  points: readonly { readonly bearingFromSouthDeg: number; readonly elevationDeg: number }[],
  stepDeg: number,
): Skyline | null {
  if (points.length === 0) return null;
  const fromNorth = points
    .map((p) => ({
      bearing: (((p.bearingFromSouthDeg + TURN / 2) % TURN) + TURN) % TURN,
      angle: Math.max(0, p.elevationDeg),
    }))
    .sort((a, b) => a.bearing - b.bearing);
  const count = Math.round(TURN / stepDeg);
  const elevationsDeg: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const bearing = i * stepDeg;
    let low = fromNorth[fromNorth.length - 1] as (typeof fromNorth)[number];
    let high = fromNorth[0] as (typeof fromNorth)[number];
    for (const point of fromNorth) {
      if (point.bearing <= bearing) low = point;
      if (point.bearing >= bearing) {
        high = point;
        break;
      }
    }
    const span = (((high.bearing - low.bearing) % TURN) + TURN) % TURN;
    const into = (((bearing - low.bearing) % TURN) + TURN) % TURN;
    const t = span === 0 ? 0 : into / span;
    elevationsDeg.push(low.angle + (high.angle - low.angle) * t);
  }
  return { stepDeg, elevationsDeg };
}

/** The stretches of a day's path that lie behind the skyline: shade, from one instant to another. */
export function shadeStretches(
  path: readonly SunPathPoint[],
  skyline: Skyline,
): { fromMs: number; toMs: number }[] {
  const stretches: { fromMs: number; toMs: number }[] = [];
  let from: number | null = null;
  let last: number | null = null;
  for (const point of path) {
    if (point.elevationDegrees <= 0) continue;
    const shaded = point.elevationDegrees < skylineAtBearing(skyline, point.azimuthDegrees);
    if (shaded && from === null) from = point.atMs;
    if (!shaded && from !== null) {
      stretches.push({ fromMs: from, toMs: point.atMs });
      from = null;
    }
    last = point.atMs;
  }
  if (from !== null && last !== null) stretches.push({ fromMs: from, toMs: last });
  return stretches;
}
