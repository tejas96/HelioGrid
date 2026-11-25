'use client';
import type { StudioView } from '@heliogrid/domain';
import { CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type CameraControlsImpl from 'camera-controls';
import { type RefObject, useEffect, useRef } from 'react';
import {
  type Box3,
  Fog,
  type PerspectiveCamera,
  Plane,
  Raycaster,
  Spherical,
  Vector2,
  Vector3,
} from 'three';
import { useGlidingMiddle } from '../hooks/use-gliding-middle';
import { useStudioWheel } from '../hooks/use-studio-wheel';
import type { StudioDrive } from './camera-drive';
import { type CameraEnd, cameraEnd, fadeIfMovedFrom, inFlight } from './camera-fade';
import {
  type ClearGround,
  groundPerPixel,
  lookRoom,
  openingDistance,
  reachOf,
  seenPerMetre,
} from './camera-limits';
import { bindHands, fitDistance, fitSpread, type GroundBox, POSE } from './camera-poses';
import { SceneLens } from './scene-lens';

export type { StudioDrive } from './camera-drive';
export type { ClearGround } from './camera-limits';
export type { GroundBox } from './camera-poses';

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

/** Where the camera looks from for a view, framing the ground around the pin in the room left free. */
export function StudioCameraRig({
  view,
  free,
  still,
  keepView,
  clear,
  metresPerPixel,
  drive,
  onTurn,
  fit,
  frameOn,
}: {
  view: StudioView;
  free: { readonly top: number; readonly bottom: number };
  still: boolean;
  /** A panel opened at the foot (Roofs, the picker): the view stays still while the roofs stay clear of it. */
  keepView: boolean;
  /** The roofs' ground: the view frames them when it opens. */
  fit: GroundBox | null;
  /**
   * A roof closed: each new value frames the roofs once, with the box from this same render, so the
   * new roof is in it. The camera stays in its view.
   */
  frameOn: object | null;
  /** The picture's sharp ground: the camera never shows past it. `null`: the grid, or no picture yet. */
  clear: ClearGround | null;
  /** The picture's ground per pixel, which sets how close the camera comes; `null` with no picture. */
  metresPerPixel: number | null;
  /** Filled with what the page's own controls ask of the camera. */
  drive: RefObject<StudioDrive | null>;
  /** Told the view's turn from north up, in radians, each time it changes. */
  onTurn: (turn: number) => void;
}) {
  const controls = useRef<CameraControlsImpl>(null);
  const camera = useThree((three) => three.camera) as PerspectiveCamera;
  const size = useThree((three) => three.size);
  const invalidate = useThree((three) => three.invalidate);
  const scene = useThree((three) => three.scene);
  const gl = useThree((three) => three.gl);
  const map = gl.domElement;
  useStudioWheel(controls, map);

  // The picture holds the camera. Out: no farther than the picture fills the room between the bars,
  // looking only where it stays on the picture. In: no nearer than it stays sharp. A resize resets.
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
    // A new limit eases the camera in or out to it, never a snap of the whole view.
    if (rig.distance > rig.maxDistance) void rig.dollyTo(rig.maxDistance, !still);
    if (rig.distance < rig.minDistance) void rig.dollyTo(rig.minDistance, !still);
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
    still,
    barTop,
    barBottom,
    invalidate,
  ]);

  // The loupe's own small picture on the graphics chip, kept between its draws.
  const lens = useRef(new SceneLens()).current;
  useEffect(() => () => lens.dispose(), [lens]);

  const caster = useRef(new Raycaster()).current;
  const pointer = useRef(new Vector2()).current;
  const level = useRef(new Plane(new Vector3(0, 1, 0), 0)).current;
  const landed = useRef(new Vector3()).current;
  const told = useRef<number | null>(null);
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
    if (told.current !== rig.azimuthAngle) {
      told.current = rig.azimuthAngle;
      onTurn(rig.azimuthAngle);
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
  useGlidingMiddle(
    camera,
    size,
    free,
    {
      still,
      keep: keepView,
      fit,
      view,
      flying: () => controls.current !== null && inFlight(controls.current),
    },
    invalidate,
  );

  // A view is flown to when it is picked, and fitted once more when the bars are first measured and
  // when the picture arrives; a resize keeps where the person turned the camera.
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
    // A picked view is flown to (faded with Reduce Motion); the first view is set at once.
    poseFor(view, !still && was !== null && was.view !== view, was !== null && was.view !== view);
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new close is what asks for the frame
  useEffect(() => {
    if (frameOn !== null) poseFor(view, !still);
  }, [frameOn]);

  const fadeIfMoved = (rig: CameraControlsImpl, before: CameraEnd) => {
    if (still) fadeIfMovedFrom(map, rig, before);
  };

  /** The view framed round the roofs, or round the pin before a roof, flown to or set at once. */
  const poseFor = (to: StudioView, move: boolean, fade = true) => {
    const rig = controls.current;
    if (rig === null) return;
    const screen = { width: size.width, height: size.height };
    const bars = { top: free.top, bottom: free.bottom };
    const spread = fit === null ? null : fitSpread(fit);
    // The roofs framed with room round them; the camera's own limits keep the picture sharp.
    const distance =
      spread !== null
        ? fitDistance(screen, bars, spread)
        : (openingDistance(metresPerPixel, size, window.devicePixelRatio) ??
          fitDistance(screen, bars));
    const middle =
      fit === null
        ? { east: 0, north: 0 }
        : { east: (fit.west + fit.east) / 2, north: (fit.south + fit.north) / 2 };
    const pose = POSE[to];
    const going = Math.min(Math.max(distance, rig.minDistance), rig.maxDistance);
    // The room for where the camera is going comes first, or the pin it flies to is cut off.
    const before = cameraEnd(rig);
    if (held) {
      room.current = lookRoom({ west, east, south, north }, seenPerMetre(size, free), going);
      rig.setBoundary(room.current);
    }
    void rig.dollyTo(going, move);
    void rig.moveTo(middle.east, 0, -middle.north, move);
    void rig.rotateTo(pose.turn, pose.tilt, move);
    if (fade) fadeIfMoved(rig, before);
    invalidate();
  };

  const zoomBy = (factor: number) => {
    const rig = controls.current;
    if (rig === null) return;
    const before = cameraEnd(rig);
    void rig.dollyTo(rig.getSpherical(heading, true).radius * factor, !still);
    fadeIfMoved(rig, before);
  };

  // The page's own controls: each moves the camera as a gesture would, inside the same limits.
  useEffect(() => {
    drive.current = {
      // Each press counts from where the last one is taking the camera: quick presses add up.
      zoomIn: () => zoomBy(1 / ZOOM_STEP),
      zoomOut: () => zoomBy(ZOOM_STEP),
      nudge: (east, north) => {
        const rig = controls.current;
        if (rig === null) return;
        const across = groundPerPixel(rig.distance, size.height) * size.width * ARROW_SHARE;
        // The library's `truck` takes y as screen-down: north is its negative.
        const before = cameraEnd(rig);
        void rig.truck(east * across, -north * across, !still);
        fadeIfMoved(rig, before);
      },
      groundAt: (clientX, clientY, height) => {
        const box = map.getBoundingClientRect();
        pointer.set(
          ((clientX - box.left) / box.width) * 2 - 1,
          -((clientY - box.top) / box.height) * 2 + 1,
        );
        caster.setFromCamera(pointer, camera);
        level.constant = -height;
        const hit = caster.ray.intersectPlane(level, landed);
        return hit === null ? null : { east: hit.x, north: -hit.z };
      },
      hold: (holding) => {
        const rig = controls.current;
        if (rig !== null) rig.enabled = !holding;
      },
      drawRound: (clientX, clientY, span, into) => {
        const box = map.getBoundingClientRect();
        const square = {
          left: clientX - box.left - span / 2,
          top: clientY - box.top - span / 2,
          side: span,
        };
        lens.draw(gl, scene, camera, size, square, into);
      },
    };
  });

  return (
    <CameraControls ref={controls} makeDefault smoothTime={still ? 0 : FLY_SECONDS} dollyToCursor />
  );
}
