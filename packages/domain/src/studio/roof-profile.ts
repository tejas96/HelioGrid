import type { GroundPoint } from './ground';
import type { BuiltFace, BuiltRoof, FaceCorner, FaceEdge } from './roof-faces';
import { type FlatShape, ringAreaM2, shapeOf, shared } from './roof-polygons';
import { lineThrough, type MovingLine, ringArea } from './wavefront-lines';

/**
 * Roofs whose height changes one way only, across the roof from one of its sides (`T-M05-002`,
 * part e): a shed, a butterfly, a sawtooth, a monitor and a curved roof. Each is a profile — the
 * height at each distance in from that side — cut into strips; each strip of the outline is one
 * flat face, and where the profile jumps a wall stands: a sawtooth's glass, a monitor's side.
 */

/** One stretch of a profile: from one distance in to another, and the height at each end. */
export interface ProfilePart {
  readonly from: number;
  readonly to: number;
  readonly fromUp: number;
  readonly toUp: number;
}

/** A standing strip where the profile jumps: its foot on the plan, and its low and high edges. */
export interface StandingWall {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  readonly lowM: number;
  readonly highM: number;
}

export interface ProfileRoof extends BuiltRoof {
  readonly walls: readonly StandingWall[];
  /** How far the roof reaches across, from the side it is measured from, in metres. */
  readonly acrossM: number;
}

const RADIANS = Math.PI / 180;
const FULL_TURN = 360;
/** Two distances or heights this close are one, in metres. */
const SAME_M = 1e-6;
/** How far each strip reaches along the roof: past any outline on a site. */
const STRIP_REACH_M = 10_000;

interface Across {
  readonly line: MovingLine;
  /** The least distance in of any corner: the profile is measured from it. */
  readonly least: number;
  readonly span: number;
}

const inOf = (line: MovingLine, point: GroundPoint) =>
  line.nx * point.east + line.ny * point.north - line.a;

/** The side the profile is measured from, and how far the outline reaches across from it. */
function acrossOf(corners: readonly GroundPoint[], side: number): Across | null {
  const from = corners[side];
  const to = corners[(side + 1) % corners.length];
  if (from === undefined || to === undefined) return null;
  const line = lineThrough({ x: from.east, y: from.north }, { x: to.east, y: to.north });
  if (line === null) return null;
  const reaches = corners.map((corner) => inOf(line, corner));
  const least = Math.min(...reaches);
  return { line, least, span: Math.max(...reaches) - least };
}

/** The strip of ground between two distances in. */
function stripOf(across: Across, part: ProfilePart): FlatShape {
  const { line, least } = across;
  const at = (along: number, inward: number): GroundPoint => ({
    east: line.nx * (line.a + least + inward) + line.ny * along,
    north: line.ny * (line.a + least + inward) - line.nx * along,
  });
  return shapeOf([
    at(-STRIP_REACH_M, part.from),
    at(STRIP_REACH_M, part.from),
    at(STRIP_REACH_M, part.to),
    at(-STRIP_REACH_M, part.to),
  ]);
}

/** What the edge of a strip along a distance is: the profile's turn there. */
function alongKind(parts: readonly ProfilePart[], index: number, atStart: boolean): FaceEdge {
  const part = parts[index] as ProfilePart;
  const here = atStart ? part.fromUp : part.toUp;
  const there = atStart ? part.toUp : part.fromUp;
  const beside = parts[atStart ? index - 1 : index + 1];
  if (beside === undefined) return here <= there ? 'eave' : 'ridge';
  const besideHere = atStart ? beside.toUp : beside.fromUp;
  const besideThere = atStart ? beside.fromUp : beside.toUp;
  if (Math.abs(besideHere - here) > SAME_M) return here > besideHere ? 'ridge' : 'valley';
  if (here > there && besideHere > besideThere) return 'ridge';
  return here < there && besideHere < besideThere ? 'valley' : 'break';
}

/** One strip's faces: the outline inside the strip, each corner at the profile's height. */
function stripFaces(
  outline: FlatShape,
  across: Across,
  parts: readonly ProfilePart[],
  index: number,
  side: number,
): BuiltFace[] | null {
  const part = parts[index] as ProfilePart;
  const pieces = shared([outline], [stripOf(across, part)]);
  if (pieces === null) return null;
  const run = part.to - part.from;
  const rise = part.toUp - part.fromUp;
  const slopeDeg = Math.atan(Math.abs(rise) / run) / RADIANS;
  const { line, least } = across;
  // The face slopes down toward the side it is measured from when it rises away from it.
  const sign = rise >= 0 ? -1 : 1;
  const downDeg = (Math.atan2(sign * line.nx, sign * line.ny) / RADIANS + FULL_TURN) % FULL_TURN;
  const reach = (point: GroundPoint) => inOf(line, point) - least;
  return pieces.map((piece) => {
    const ring = anticlockwise(piece.outer);
    const corners: FaceCorner[] = ring.map((point) => ({
      ...point,
      up: part.fromUp + ((reach(point) - part.from) / run) * rise,
    }));
    const edges = ring.map((point, i): FaceEdge => {
      const next = ring[(i + 1) % ring.length] as GroundPoint;
      const [a, b] = [reach(point), reach(next)];
      if (Math.abs(a - part.from) < SAME_M && Math.abs(b - part.from) < SAME_M) {
        return alongKind(parts, index, true);
      }
      if (Math.abs(a - part.to) < SAME_M && Math.abs(b - part.to) < SAME_M) {
        return alongKind(parts, index, false);
      }
      return 'gable_end';
    });
    const areaM2 = ringAreaM2(ring);
    const surfaceM2 = areaM2 / Math.cos(slopeDeg * RADIANS);
    return { side, ring: 0, corners, edges, slopeDeg, downDeg, areaM2, surfaceM2, upper: false };
  });
}

function anticlockwise(ring: readonly GroundPoint[]): readonly GroundPoint[] {
  const area = ringArea(ring.map((point) => ({ x: point.east, y: point.north })));
  return area >= 0 ? ring : [...ring].reverse();
}

/**
 * The walls that stand where the profile jumps: along the jump's line, under the higher of the two
 * faces that meet there.
 */
function wallsOf(
  across: Across,
  parts: readonly ProfilePart[],
  faces: readonly (readonly BuiltFace[])[],
): StandingWall[] {
  const reach = (point: GroundPoint) => inOf(across.line, point) - across.least;
  const walls: StandingWall[] = [];
  parts.forEach((part, index) => {
    const before = parts[index - 1];
    if (before === undefined || Math.abs(before.toUp - part.fromUp) <= SAME_M) return;
    const lowM = Math.min(before.toUp, part.fromUp);
    const highM = Math.max(before.toUp, part.fromUp);
    const higher = faces[part.fromUp > before.toUp ? index : index - 1] ?? [];
    for (const face of higher) {
      face.corners.forEach((corner, i) => {
        const next = face.corners[(i + 1) % face.corners.length] as FaceCorner;
        const onJump = [corner, next].every((end) => Math.abs(reach(end) - part.from) < SAME_M);
        if (onJump) walls.push({ from: corner, to: next, lowM, highM });
      });
    }
  });
  return walls;
}

/**
 * The roof a profile makes over an outline, measured in from one of its sides; `null` when the
 * outline cannot be cut into its strips. `partsFor` is given how far the outline reaches across.
 */
export function profileRoof(
  corners: readonly GroundPoint[],
  side: number,
  partsFor: (acrossM: number) => readonly ProfilePart[],
): ProfileRoof | null {
  const ring = anticlockwise(corners);
  // A ring turned round numbers its sides the other way: side i becomes side n − 2 − i.
  const turned = ring !== corners;
  const count = corners.length;
  const measured = turned ? (count - 2 - side + count) % count : side;
  const across = acrossOf(ring, measured);
  if (across === null || across.span < SAME_M) return null;
  const parts = partsFor(across.span).filter((part) => part.to - part.from > SAME_M);
  const byPart: BuiltFace[][] = [];
  for (let index = 0; index < parts.length; index++) {
    const strip = stripFaces(shapeOf(ring), across, parts, index, side);
    if (strip === null) return null;
    byPart.push(strip);
  }
  const topM = parts.reduce((top, part) => Math.max(top, part.fromUp, part.toUp), 0);
  return {
    faces: byPart.flat(),
    topM,
    walls: wallsOf(across, parts, byPart),
    acrossM: across.span,
  };
}
