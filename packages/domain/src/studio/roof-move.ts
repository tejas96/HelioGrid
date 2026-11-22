import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { type DragResult, faultOf, roofAt, type TurnResult, withRoof } from './roof-check';
import { cornerAfter, roofMiddle } from './roof-shape';
import { type Guide, guideOf, snapTargetsOf } from './roof-snap';

/**
 * Moving and turning a whole roof once it stands (`T-M05-002`, part b): the move and turn handles,
 * and their arrow keys. A turn lines up with another roof's edge, which shows as a guide.
 */

/** Within this many degrees, a turned roof lines up with another roof's edge. */
export const TURN_SNAP_DEGREES = 3;
/** One arrow key on a move handle moves the roof this far, in metres. */
export const KEY_MOVE_M = 0.1;
/** One arrow key on a turn handle turns the roof this far, in degrees. */
export const KEY_TURN_DEGREES = 1;

/** The whole roof moved by `by` metres east and north. */
export function roofMoved(
  document: StudioDocument,
  roofIndex: number,
  by: GroundPoint,
): DragResult {
  const roof = roofAt(document, roofIndex);
  const corners = roof.corners.map((c) => ({ east: c.east + by.east, north: c.north + by.north }));
  return {
    document: withRoof(document, roofIndex, { ...roof, corners }),
    snap: null,
    fault: faultOf(document, roofIndex, corners),
    guides: [],
  };
}

/** The difference between two directions of lines, in degrees, folded into −90 to 90. */
function lineTurn(from: number, to: number): number {
  let turn = (to - from) % 180;
  if (turn > 90) turn -= 180;
  if (turn < -90) turn += 180;
  return turn;
}

function directionOf(a: GroundPoint, b: GroundPoint): number {
  return (Math.atan2(b.north - a.north, b.east - a.east) * 180) / Math.PI;
}

/**
 * The roof turned `degrees` anticlockwise about its middle. With the magnet on, within
 * `TURN_SNAP_DEGREES` of lining an edge up with another roof's edge, it lines up.
 */
export function roofTurned(
  document: StudioDocument,
  roofIndex: number,
  degrees: number,
  magnet: boolean,
): TurnResult {
  const roof = roofAt(document, roofIndex);
  const edges = magnet ? snapTargetsOf(document.roofs, roofIndex).edges : [];
  const targets = edges.map((e) => directionOf(e.from, e.to));
  let applied = degrees;
  let lined: number | null = null;
  let nearest = TURN_SNAP_DEGREES + 1e-9;
  roof.corners.forEach((corner, i) => {
    const own = directionOf(corner, cornerAfter(roof.corners, i)) + degrees;
    targets.forEach((target, t) => {
      const off = lineTurn(own, target);
      if (Math.abs(off) <= nearest) {
        nearest = Math.abs(off);
        applied = degrees + off;
        lined = t;
      }
    });
  });
  // The edge it lines up with shows as a guide, as a corner's hold does.
  const edge = lined === null ? undefined : edges[lined];
  const guides: Guide[] =
    edge === undefined
      ? []
      : [
          guideOf(edge.from, {
            east: edge.to.east - edge.from.east,
            north: edge.to.north - edge.from.north,
          }),
        ];
  const middle = roofMiddle(roof.corners);
  const r = (applied * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const corners = roof.corners.map((c) => ({
    east: middle.east + (c.east - middle.east) * cos - (c.north - middle.north) * sin,
    north: middle.north + (c.east - middle.east) * sin + (c.north - middle.north) * cos,
  }));
  return {
    document: withRoof(document, roofIndex, { ...roof, corners }),
    snap: null,
    fault: faultOf(document, roofIndex, corners),
    guides,
    degrees: applied,
    snapped: lined !== null,
  };
}
