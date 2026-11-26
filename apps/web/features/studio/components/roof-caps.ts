import type { LookCap } from '@heliogrid/domain';
import { Vector3 } from 'three';
import { inScene, type Triangles, type Vertex } from './roof-mesh';

/**
 * The caps along a sloped roof's ridges and hips (`T-M05-002`, part e, roof looks): a folded
 * flashing on a sheet, a half-round of tiles on a tiled roof, each in the roof's colour. A ridge
 * two faces share is capped once.
 */

export interface CapSegment {
  readonly from: Vertex;
  readonly to: Vertex;
}

/** A folded flashing: how far it reaches down each side, and how far its fold stands proud. */
const FOLD_SIDE_M = 0.16;
const FOLD_RISE_M = 0.035;
const FOLD_EDGE_M = 0.01;
/** A half-round of tiles: its radius, sunk so it sits on the faces, in this many pieces. */
const ROUND_M = 0.1;
const ROUND_SUNK_M = 0.035;
const ROUND_PIECES = 8;
/** A line this near upright has no level way across it: a cap needs one. */
const UPRIGHT = 1e-9;
/** Ends this close are one point, in metres. */
const SAME_M = 1e-3;

/** One quad, its normal facing away from the cap's middle line. */
function quad(into: Triangles, a: Vector3, b: Vector3, c: Vector3, d: Vector3, middle: Vector3) {
  const normal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(d, a)).normalize();
  const outward = new Vector3().subVectors(a, middle).dot(normal) >= 0;
  const [p, q, r, s] = outward ? [a, b, c, d] : [a, d, c, b];
  if (!outward) normal.negate();
  for (const at of [p, q, r, p, r, s]) {
    into.positions.push(at.x, at.y, at.z);
    into.normals.push(normal.x, normal.y, normal.z);
    into.uvs.push(0, 0);
  }
}

/** The cross-section a cap draws, as offsets across the line and up from it. */
function profileOf(kind: LookCap): readonly (readonly [across: number, up: number])[] {
  if (kind === 'folded')
    return [
      [-FOLD_SIDE_M, -FOLD_EDGE_M],
      [0, FOLD_RISE_M],
      [FOLD_SIDE_M, -FOLD_EDGE_M],
    ];
  return Array.from({ length: ROUND_PIECES + 1 }, (_, i) => {
    const angle = (Math.PI * i) / ROUND_PIECES;
    return [-Math.cos(angle) * ROUND_M, Math.sin(angle) * ROUND_M - ROUND_SUNK_M] as const;
  });
}

const keyOf = (at: Vertex) =>
  [at.east, at.north, at.up].map((value) => Math.round(value / SAME_M)).join(',');

/** Each ridge and hip once, whichever face named it first and whichever way it ran. */
function onceEach(segments: readonly CapSegment[]): CapSegment[] {
  const seen = new Set<string>();
  return segments.filter(({ from, to }) => {
    const ends = [keyOf(from), keyOf(to)].sort().join('|');
    if (seen.has(ends)) return false;
    seen.add(ends);
    return true;
  });
}

export function capsInto(into: Triangles, segments: readonly CapSegment[], kind: LookCap) {
  const profile = profileOf(kind);
  for (const { from, to } of onceEach(segments)) {
    const a = inScene(from);
    const b = inScene(to);
    const along = new Vector3().subVectors(b, a);
    if (along.length() < SAME_M) continue;
    along.normalize();
    // Across the line on the level, then up square to both; a line standing upright has no cap.
    const across = new Vector3().crossVectors(along, new Vector3(0, 1, 0));
    if (across.lengthSq() < UPRIGHT) continue;
    across.normalize();
    const up = new Vector3().crossVectors(across, along).normalize();
    if (up.y < 0) up.negate();
    const at = (end: Vector3, [x, y]: readonly [number, number]) =>
      end.clone().addScaledVector(across, x).addScaledVector(up, y);
    const middle = a
      .clone()
      .add(b)
      .multiplyScalar(1 / 2)
      .addScaledVector(up, -ROUND_M);
    for (let i = 0; i + 1 < profile.length; i += 1) {
      const p = profile[i] as readonly [number, number];
      const q = profile[i + 1] as readonly [number, number];
      quad(into, at(a, p), at(a, q), at(b, q), at(b, p), middle);
    }
  }
}
