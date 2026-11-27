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

/**
 * LiDAR's steepest tilt from straight down: lower, the scan's walls stand across the view and the
 * dark stage fills the rest of it.
 */
const LIDAR_TILT_MAX_DEGREES = 60;
export const LIDAR_TILT_MAX = LIDAR_TILT_MAX_DEGREES * RADIANS;

/**
 * The tilt a pose flies to: the view's own when it turns to it, else the person's; under LiDAR
 * never past the tilt its scan reads at.
 */
export function poseTilt(to: StudioView, lidar: boolean, turn: boolean, now: number): number {
  const capped = lidar && to !== 'top';
  if (turn) return capped ? Math.min(POSE[to].tilt, LIDAR_TILT_MAX) : POSE[to].tilt;
  return capped ? Math.min(now, LIDAR_TILT_MAX) : now;
}

/** Where the day's path stands, which the sun's view frames. */
export interface SunFrame {
  readonly east: number;
  readonly north: number;
  readonly radiusM: number;
  /** The ground the roofs' own frame spreads over (`fitSpread`), which the view always holds. */
  readonly roofsSpreadM: number;
  /** The noon sun's compass bearing and height, in degrees. */
  readonly noonAzimuthDegrees: number;
  readonly noonElevationDegrees: number;
}

/**
 * The sun's view (`T-M05-002`, part g): low enough that the day's path arches over the roofs with
 * the horizon in sight, from the side away from the noon sun, looking a share of the path's noon
 * height up, the path framed whole with room round it.
 */
const SUN_TILT_DEGREES = 76;
/**
 * The steepest the sun's view tilts down to, a degree at a time, so the ground at the foot of the
 * room it shows stays on the picture when the roofs' frame stands it far out (a phone).
 */
const SUN_TILT_LEAST_DEGREES = 50;
const SUN_LOOK_UP_SHARE = 0.25;
const SUN_FRAME_ROOM = 1.1;

/** The share of the way to the picture's edge the ground at the view's foot may reach. */
const SUN_FOOT_ON_PICTURE = 0.85;

/** How far a point may go from `from` along `step` before it leaves `low`..`high`. */
const leave = (from: number, step: number, low: number, high: number) =>
  step === 0 ? Number.POSITIVE_INFINITY : ((step > 0 ? high : low) - from) / step;

/**
 * How far back from the point looked at the ground at the foot of the room between the bars lies,
 * from `distance` off at `tilt`, looking `upM` over the ground.
 */
function footBackOf(
  tilt: number,
  distance: number,
  upM: number,
  size: { readonly height: number },
  free: { readonly top: number; readonly bottom: number },
) {
  const room = Math.max(1, size.height - free.top - free.bottom) / size.height;
  const foot = tilt - Math.atan(Math.tan((fieldOfView() / 2) * RADIANS) * room);
  return distance * (Math.sin(tilt) - Math.cos(tilt) * Math.tan(foot)) - upM * Math.tan(foot);
}

/**
 * The sun's view (`T-M05-002`, part g): its pose — how far off, the point it looks at, its tilt
 * and its turn — and the day's path's radius drawn for it. The roofs are framed whole first, with
 * the room the 3D view gives them. The path is framed whole too, unless the camera would then
 * stand past the picture's edge: then it stands no farther than the roofs' frame or the picture
 * allows, whichever is farther, and the path is drawn to fit what it sees. Where the roofs' frame
 * still stands it past the edge, it tilts down until the ground at the foot of the room it shows
 * is on the picture; the haze takes the far edge.
 */
export function sunViewOf(
  frame: SunFrame,
  size: { readonly width: number; readonly height: number },
  free: { readonly top: number; readonly bottom: number },
  clear: GroundBox | null,
) {
  const noon = frame.noonAzimuthDegrees * RADIANS;
  // The camera stands on the side away from the noon sun, looking toward it.
  const turn = Math.atan2(-Math.sin(noon), Math.cos(noon));
  const upM = frame.radiusM * Math.sin(frame.noonElevationDegrees * RADIANS) * SUN_LOOK_UP_SHARE;
  const whole = fitDistance(size, free, frame.radiusM * SUN_FRAME_ROOM);
  const edge =
    clear === null
      ? Number.POSITIVE_INFINITY
      : Math.min(
          leave(frame.east, Math.sin(turn), clear.west, clear.east),
          leave(frame.north, -Math.cos(turn), clear.south, clear.north),
        );
  const reach = edge * SUN_FOOT_ON_PICTURE;
  const steep = SUN_TILT_DEGREES * RADIANS;
  // The foot's distance back grows with the camera's: the farthest that keeps it on the picture.
  const back = footBackOf(steep, whole, upM, size, free);
  const onPicture = back > 0 ? (reach * whole) / back : whole;
  const roofs = fitDistance(size, free, frame.roofsSpreadM);
  const distance = Math.max(roofs, Math.min(whole, Math.max(0, onPicture)));
  const share = Math.min(1, distance / whole);
  const lookUpM = upM * share;
  let tilt = steep;
  const least = SUN_TILT_LEAST_DEGREES * RADIANS;
  while (tilt > least && footBackOf(tilt, distance, lookUpM, size, free) > reach) tilt -= RADIANS;
  return {
    distance,
    at: { east: frame.east, north: frame.north, upM: lookUpM },
    tilt,
    turn,
    radiusM: frame.radiusM * share,
  };
}
