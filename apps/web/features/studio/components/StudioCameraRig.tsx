'use client';
import type { StudioView } from '@heliogrid/domain';
import { CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import CameraControlsImpl from 'camera-controls';
import { type RefObject, useEffect, useRef } from 'react';
import { type Box3, Fog, MathUtils, type PerspectiveCamera, Spherical } from 'three';
import { useStudioWheel } from '../hooks/use-studio-wheel';
import {
  type ClearGround,
  fieldOfView,
  groundPerPixel,
  lookRoom,
  openingDistance,
  reachOf,
  seenPerMetre,
} from './camera-limits';

export type { ClearGround } from './camera-limits';

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
/** How long the camera takes to fly to a new view, in seconds. */
const FLY_SECONDS = 0.25;
/**
 * The haze, as a share of the camera's distance: the ground in view stays clear, and the far
 * ground fades into the page whatever the zoom.
 */
const HAZE_FROM = 1;
const HAZE_TO = 2.4;
/**
 * The camera's near plane, as a share of its distance: depth stays fine enough at every zoom that
 * the ground's layers, a centimetre apart, never show through each other.
 */
const NEAR_SHARE = 0.02;

/** Each press of Zoom in or Zoom out moves the camera this many times nearer or farther. */
const ZOOM_STEP = 1.6;
/** Each arrow key moves the map this share of the window. */
const ARROW_SHARE = 0.15;

/** What the page's own controls ask of the camera: the zoom buttons, Back to the pin, the arrow keys. */
export interface StudioDrive {
  zoomIn(): void;
  zoomOut(): void;
  /** The view as it opens: the pin in the middle, framed. */
  home(): void;
  /** One arrow key's move: `east` and `north` are each -1, 0 or 1. */
  nudge(east: number, north: number): void;
}

/** What the camera tells the page each time it moves: the ground one screen pixel covers, its turn. */
export interface StudioMarks {
  readonly metresPerPixel: number;
  /** Radians the view is turned from north up. */
  readonly turn: number;
}

/** The camera's pose for each view: its tilt from straight down and its compass turn. */
const POSE: Record<StudioView, { readonly tilt: number; readonly turn: number }> = {
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
function bindHands(rig: CameraControlsImpl, top: boolean): void {
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

/** How far the camera stands to frame the ground around the pin in the room between the bars. */
function fitDistance(
  size: { readonly width: number; readonly height: number },
  free: { readonly top: number; readonly bottom: number },
): number {
  const freeHeight = Math.max(1, size.height - free.top - free.bottom);
  const reach = FRAME_RADIUS_M / Math.tan((fieldOfView() / 2) * RADIANS);
  return Math.max(reach / (freeHeight / size.height), reach / (size.width / size.height));
}

/** Where the camera looks from for a view, framing the ground around the pin in the room left free. */
export function StudioCameraRig({
  view,
  free,
  still,
  clear,
  metresPerPixel,
  drive,
  onMarks,
}: {
  view: StudioView;
  free: { readonly top: number; readonly bottom: number };
  still: boolean;
  /** The picture's sharp ground: the camera never shows past it. `null`: the grid, or no picture yet. */
  clear: ClearGround | null;
  /** The picture's ground per pixel, which sets how close the camera comes; `null` with no picture. */
  metresPerPixel: number | null;
  /** Filled with what the page's own controls ask of the camera. */
  drive: RefObject<StudioDrive | null>;
  /** Told the scale and the turn each time the camera moves. */
  onMarks: (marks: StudioMarks) => void;
}) {
  const controls = useRef<CameraControlsImpl>(null);
  const camera = useThree((three) => three.camera) as PerspectiveCamera;
  const size = useThree((three) => three.size);
  const invalidate = useThree((three) => three.invalidate);
  const scene = useThree((three) => three.scene);
  const map = useThree((three) => three.gl.domElement);
  useStudioWheel(controls, map);

  // The picture holds the camera. Out: no farther than the picture fills the room between the bars,
  // looking only where that room stays on the picture. In: no nearer than the picture stays sharp.
  // A turned phone or a resize sets all three again.
  const { west, east, south, north } = clear ?? { west: 0, east: 0, south: 0, north: 0 };
  const held = clear !== null;
  const room = useRef<Box3 | null>(null);
  const { width, height } = size;
  const { top: barTop, bottom: barBottom } = free;
  useEffect(() => {
    const rig = controls.current;
    if (rig === null) return;
    room.current = null;
    const reach = reachOf(
      held ? { west, east, south, north } : null,
      metresPerPixel,
      { width, height },
      { top: barTop, bottom: barBottom },
    );
    rig.maxDistance = reach.farthest;
    rig.minDistance = reach.nearest;
    if (!held) rig.setBoundary();
    if (rig.distance > rig.maxDistance) void rig.dollyTo(rig.maxDistance, false);
    if (rig.distance < rig.minDistance) void rig.dollyTo(rig.minDistance, false);
    invalidate();
  }, [
    held,
    west,
    east,
    south,
    north,
    metresPerPixel,
    width,
    height,
    barTop,
    barBottom,
    invalidate,
  ]);

  const told = useRef<StudioMarks | null>(null);
  const heading = useRef(new Spherical()).current;
  // Each drawn frame sets the haze from where the camera stands now, and the room it may look in.
  useFrame(() => {
    const rig = controls.current;
    if (rig === null) return;
    const { fog } = scene;
    if (fog instanceof Fog) {
      fog.near = rig.distance * HAZE_FROM;
      fog.far = rig.distance * HAZE_TO;
    }
    const near = rig.distance * NEAR_SHARE;
    if (camera.near !== near) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
    const perPixel = groundPerPixel(rig.distance, size.height);
    const said = told.current;
    if (said === null || said.metresPerPixel !== perPixel || said.turn !== rig.azimuthAngle) {
      told.current = { metresPerPixel: perPixel, turn: rig.azimuthAngle };
      onMarks(told.current);
    }
    if (!held) return;
    // The room is the one the camera is going to: while it flies in, the pin it flies to stays
    // inside, though the room it leaves was too small to hold it.
    const going = rig.getSpherical(heading, true).radius;
    const next = lookRoom({ west, east, south, north }, seenPerMetre(size, free), going);
    if (room.current?.equals(next)) return;
    room.current = next;
    rig.setBoundary(next);
  });

  // The free room between the bars: the framed ground sits in its middle, whatever the camera does.
  useEffect(() => {
    camera.fov = fieldOfView();
    camera.setViewOffset(
      size.width,
      size.height,
      0,
      (free.bottom - free.top) / 2,
      size.width,
      size.height,
    );
    camera.updateProjectionMatrix();
    invalidate();
  }, [free.top, free.bottom, size.width, size.height, camera, invalidate]);

  // A view is flown to when it is picked, and fitted once more when the bars are first measured; a
  // resize keeps where the person turned the camera.
  // …and once more when the picture arrives: the view settles at its sharpness before anyone moves it.
  const posed = useRef<{
    readonly view: StudioView;
    readonly measured: boolean;
    readonly pictured: boolean;
  } | null>(null);
  useEffect(() => {
    const rig = controls.current;
    if (rig === null) return;
    const measured = free.top > 0 || free.bottom > 0;
    const pictured = metresPerPixel !== null;
    const was = posed.current;
    const settled =
      was !== null &&
      was.view === view &&
      (was.measured || !measured) &&
      (was.pictured || !pictured);
    if (settled) return;
    posed.current = { view, measured, pictured };
    bindHands(rig, view === 'top');
    // The camera flies to a picked view; the first view and a reduced-motion one are set at once.
    poseFor(view, !still && was !== null && was.view !== view);
  });

  /** The view framed round the pin, flown to or set at once. */
  const poseFor = (to: StudioView, move: boolean) => {
    const rig = controls.current;
    if (rig === null) return;
    const distance =
      openingDistance(metresPerPixel, size, window.devicePixelRatio) ??
      fitDistance(
        { width: size.width, height: size.height },
        { top: free.top, bottom: free.bottom },
      );
    const pose = POSE[to];
    const going = Math.min(Math.max(distance, rig.minDistance), rig.maxDistance);
    // The room for where the camera is going comes first, or the pin it flies to is cut off.
    if (held) {
      room.current = lookRoom({ west, east, south, north }, seenPerMetre(size, free), going);
      rig.setBoundary(room.current);
    }
    void rig.dollyTo(going, move);
    void rig.moveTo(0, 0, 0, move);
    void rig.rotateTo(pose.turn, pose.tilt, move);
    invalidate();
  };

  const zoomBy = (factor: number) => {
    const rig = controls.current;
    if (rig !== null) void rig.dollyTo(rig.getSpherical(heading, true).radius * factor, !still);
  };

  // The page's own controls: each moves the camera as a gesture would, inside the same limits.
  useEffect(() => {
    drive.current = {
      // Each press counts from where the last one is taking the camera: quick presses add up.
      zoomIn: () => zoomBy(1 / ZOOM_STEP),
      zoomOut: () => zoomBy(ZOOM_STEP),
      home: () => poseFor(view, !still),
      nudge: (east, north) => {
        const rig = controls.current;
        if (rig === null) return;
        const across = groundPerPixel(rig.distance, size.height) * size.width * ARROW_SHARE;
        // The library's `truck` takes y as screen-down: north is its negative.
        void rig.truck(east * across, -north * across, !still);
      },
    };
  });

  return (
    <CameraControls ref={controls} makeDefault smoothTime={still ? 0 : FLY_SECONDS} dollyToCursor />
  );
}
