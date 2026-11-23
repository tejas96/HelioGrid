import type { ScreenPoint } from './label-layout';

/**
 * Where a point of the scene lands on the screen (`T-M05-002`, part e): every mark the page keeps
 * on the model — a height, a ring, an arrow, the pin — is placed through here, with the camera of
 * the frame being drawn. A camera's own view matrix is refreshed only when a frame is drawn, so a
 * mark placed with it before the draw trails the model by one frame; this reads where the camera
 * stands and how it is turned now, and works the view out itself.
 */

/** A point of the scene, in its own metres: x east, y up, z south. */
export interface ScenePoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** A camera as it stands now: its place, its turn, and how it projects. */
export interface CameraPose {
  readonly position: ScenePoint;
  /** The camera's turn as a unit quaternion. */
  readonly quaternion: ScenePoint & { readonly w: number };
  /** The projection matrix's sixteen numbers, column by column. */
  readonly projection: ArrayLike<number>;
}

/** Where a scene point lands, in CSS pixels; `null` behind the camera or past its far reach. */
export type ScreenProjector = (x: number, y: number, z: number) => ScreenPoint | null;

/** The matrix's number at a row and a column, each counted from 0. */
function cell(matrix: ArrayLike<number>, row: number, column: number): number {
  return matrix[column * 4 + row] ?? 0;
}

/**
 * The screen place of any scene point for a camera standing as `pose` says, on a screen of `size`.
 * The pose is read once, here: the projector keeps the frame it was made for, however the camera
 * moves after.
 */
export function screenProjector(
  pose: CameraPose,
  size: { readonly width: number; readonly height: number },
): ScreenProjector {
  const { x: px, y: py, z: pz } = pose.position;
  const { x: qx, y: qy, z: qz, w: qw } = pose.quaternion;
  // The turn's inverse as three rows: a unit quaternion's inverse turn is its matrix laid on its side.
  const r00 = 1 - 2 * (qy * qy + qz * qz);
  const r01 = 2 * (qx * qy + qz * qw);
  const r02 = 2 * (qx * qz - qy * qw);
  const r10 = 2 * (qx * qy - qz * qw);
  const r11 = 1 - 2 * (qx * qx + qz * qz);
  const r12 = 2 * (qy * qz + qx * qw);
  const r20 = 2 * (qx * qz + qy * qw);
  const r21 = 2 * (qy * qz - qx * qw);
  const r22 = 1 - 2 * (qx * qx + qy * qy);
  const p = Array.from({ length: 16 }, (_, i) => pose.projection[i] ?? 0);
  const { width, height } = size;
  return (x, y, z) => {
    const dx = x - px;
    const dy = y - py;
    const dz = z - pz;
    // The point as the camera sees it: right, up, and back toward the eye.
    const cx = r00 * dx + r01 * dy + r02 * dz;
    const cy = r10 * dx + r11 * dy + r12 * dz;
    const cz = r20 * dx + r21 * dy + r22 * dz;
    const w = cell(p, 3, 0) * cx + cell(p, 3, 1) * cy + cell(p, 3, 2) * cz + cell(p, 3, 3);
    if (w <= 0) return null;
    const depth = cell(p, 2, 0) * cx + cell(p, 2, 1) * cy + cell(p, 2, 2) * cz + cell(p, 2, 3);
    if (depth > w) return null;
    const across = cell(p, 0, 0) * cx + cell(p, 0, 1) * cy + cell(p, 0, 2) * cz + cell(p, 0, 3);
    const up = cell(p, 1, 0) * cx + cell(p, 1, 1) * cy + cell(p, 1, 2) * cz + cell(p, 1, 3);
    return { x: ((across / w + 1) / 2) * width, y: ((1 - up / w) / 2) * height };
  };
}
