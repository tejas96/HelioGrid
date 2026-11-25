'use client';
import type { GroundBox, StudioView } from '@heliogrid/domain';
import CameraControlsImpl from 'camera-controls';
import { MathUtils } from 'three';
import { fieldOfView } from './camera-limits';

/**
 * The studio camera's poses (`T-M05-002a`): the tilt and turn of each view, which hand does what in
 * it, and how far the camera stands to frame the ground it is asked to.
 */

const { ACTION } = CameraControlsImpl;
const RADIANS = MathUtils.DEG2RAD;
/** The ground a view frames around the pin where there is no picture to show at its own sharpness. */
const FRAME_RADIUS_M = 13;
/** The 3D view's tilt from straight down, and how far round from the south it looks. */
const TILT_3D_DEGREES = 46;
const TILT_3D = TILT_3D_DEGREES * RADIANS;
const TURN_3D_DEGREES = 18;
const TURN_3D = TURN_3D_DEGREES * RADIANS;
const TILT_SIDE_DEGREES = 78;
const TILT_SIDE = TILT_SIDE_DEGREES * RADIANS;
const TILT_MAX_DEGREES = 85;
const TILT_MAX = TILT_MAX_DEGREES * RADIANS;

export type { GroundBox };

/** What the camera frames: a ground box, looked at `upM` above the ground (the open roof's top). */
export interface SceneFit extends GroundBox {
  readonly upM?: number;
}

/** Where the camera looks for a frame: the box's middle, `upM` above the ground; the pin with none. */
export function fitMiddle(fit: SceneFit | null) {
  if (fit === null) return { east: 0, north: 0, upM: 0 };
  return { east: (fit.west + fit.east) / 2, north: (fit.south + fit.north) / 2, upM: fit.upM ?? 0 };
}

/** The room round the framed roofs, as a share of their size. */
const FIT_ROOM = 2;

/** The ground the view frames round a box of roofs: half its longer side, with room round it. */
export function fitSpread(fit: GroundBox): number {
  return (Math.max(fit.east - fit.west, fit.north - fit.south) / 2) * FIT_ROOM;
}

/** The camera's pose for each view: its tilt from straight down and its compass turn. */
export const POSE: Record<StudioView, { readonly tilt: number; readonly turn: number }> = {
  top: { tilt: 0, turn: 0 },
  '3d': { tilt: TILT_3D, turn: TURN_3D },
  north: { tilt: TILT_SIDE, turn: Math.PI },
  east: { tilt: TILT_SIDE, turn: Math.PI / 2 },
  south: { tilt: TILT_SIDE, turn: 0 },
  west: { tilt: TILT_SIDE, turn: -Math.PI / 2 },
};

/**
 * Which hand does what in a view. The top view is a map: a drag pans and nothing tilts. In 3D a drag
 * turns the camera; on a phone two fingers pinch to zoom and drag to tilt (`T-M05-002a`).
 */
export function bindHands(rig: CameraControlsImpl, top: boolean): void {
  rig.mouseButtons.left = top ? ACTION.TRUCK : ACTION.ROTATE;
  rig.mouseButtons.right = ACTION.TRUCK;
  rig.mouseButtons.wheel = ACTION.DOLLY;
  rig.touches.one = top ? ACTION.TOUCH_TRUCK : ACTION.TOUCH_ROTATE;
  rig.touches.two = ACTION.TOUCH_DOLLY_ROTATE;
  rig.touches.three = ACTION.TOUCH_TRUCK;
  rig.minPolarAngle = 0;
  rig.maxPolarAngle = top ? 0 : TILT_MAX;
  rig.azimuthRotateSpeed = top ? 0 : 1;
}

/** How far the camera stands to frame `radius` metres of ground in the room between the bars. */
export function fitDistance(
  size: { readonly width: number; readonly height: number },
  free: { readonly top: number; readonly bottom: number },
  radius: number = FRAME_RADIUS_M,
): number {
  const freeHeight = Math.max(1, size.height - free.top - free.bottom);
  const freeWidth = Math.max(1, size.width);
  const reach = radius / Math.tan((fieldOfView() / 2) * RADIANS);
  return Math.max(reach / (freeHeight / size.height), reach / (freeWidth / size.height));
}
