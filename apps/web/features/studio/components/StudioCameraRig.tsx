'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioView } from '@heliogrid/domain';
import { CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type CameraControlsImpl from 'camera-controls';
import { type RefObject, useEffect, useRef } from 'react';
import { Fog, type PerspectiveCamera, Vector3 } from 'three';
import { useArrowPressHold } from '../hooks/use-arrow-press-hold';
import { useGlidingMiddle, useLookHeight } from '../hooks/use-gliding-middle';
import { useStudioWheel } from '../hooks/use-studio-wheel';
import { driveOf, type StudioDrive } from './camera-drive';
import { type CameraEnd, cameraEnd, fadeIfMovedFrom, inFlight } from './camera-fade';
import { CameraFraming, type FrameTo } from './camera-framing';
import { type ClearGround, hazeOf, openingDistance } from './camera-limits';
import {
  bindHands,
  fitDistance,
  fitMiddle,
  fitSpread,
  LIDAR_TILT_MAX,
  POSE,
  poseTilt,
  type SceneFit,
  type SunFrame,
  sunViewOf,
} from './camera-poses';
import { SceneLens } from './scene-lens';

export type { StudioDrive } from './camera-drive';
export type { ClearGround } from './camera-limits';
export type { SunFrame } from './camera-poses';

/** How long the camera takes to fly to a new view, in seconds. */
const FLY_SECONDS = 0.25;
/**
 * The camera's near plane, as a share of its distance: depth stays fine enough at every zoom that
 * the ground's layers, a centimetre apart, never show through each other.
 */
const NEAR_SHARE = 0.02;

/** The view held still under a held arrow, whatever is in sight. */
const ARROW_HOLD = { clear: null } as const;
/** Where the camera looks from for a view, framing the ground around the pin in the room left free. */
export function StudioCameraRig({
  view,
  free,
  still,
  heldView,
  clear,
  metresPerPixel,
  drive,
  onTurn,
  fit,
  frameOn,
  arrowHeld,
  lidar,
  sun,
}: {
  view: StudioView;
  free: { readonly top: number; readonly bottom: number };
  still: boolean;
  /** The view stays still as the bars change (drawing, Roofs, the picker) while `clear` is in sight. */
  heldView: StudioScreen['heldView'];
  /** The roofs' ground: the view frames them when it opens. */
  fit: SceneFit | null;
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
  /**
   * An arrow on the model is held: the camera holds still under the finger, and the frames the
   * sheet's room or the roof's height would ask wait for it to be let go.
   */
  arrowHeld: boolean;
  /** LiDAR is on: the view keeps to a tilt its scan reads at. */
  lidar: boolean;
  /** The sun's bar is open: its view frames the day's path over the roofs; `null` while closed. */
  sun: SunFrame | null;
}) {
  const controls = useRef<CameraControlsImpl>(null);
  const camera = useThree((three) => three.camera) as PerspectiveCamera;
  const size = useThree((three) => three.size);
  const invalidate = useThree((three) => three.invalidate);
  const scene = useThree((three) => three.scene);
  const gl = useThree((three) => three.gl);
  const map = gl.domElement;
  useStudioWheel(controls, map);

  // The picture holds the camera (`camera-framing.ts`); a resize resets its limits.
  const { west, east, south, north } = clear ?? { west: 0, east: 0, south: 0, north: 0 };
  const held = clear !== null;
  const box = held ? { west, east, south, north } : null;
  const inputs = { clear: box, metresPerPixel, size, free, still, whole: lidar };
  const framing = useRef(new CameraFraming(inputs)).current;
  framing.inputs = inputs;
  const { width, height } = size;
  const { top: barTop, bottom: barBottom } = free;
  // biome-ignore lint/correctness/useExhaustiveDependencies: these are what the limits are worked from
  useEffect(() => {
    const rig = controls.current;
    if (rig === null) return;
    framing.reset(rig);
    invalidate();
  }, [held, west, east, south, north, metresPerPixel, width, height, still, barTop, barBottom]);

  // The loupe's own small picture on the graphics chip, kept between its draws.
  const lens = useRef(new SceneLens()).current;
  useEffect(() => () => lens.dispose(), [lens]);

  const told = useRef<number | null>(null);
  const looked = useRef(new Vector3()).current;
  // Each drawn frame sets the haze from where the camera stands now, the limits for the tilt it is
  // going to, and the room it may look in.
  useFrame(() => {
    const rig = controls.current;
    if (rig === null) return;
    const { fog } = scene;
    // The far ground fades into the sky, or the page straight down, before the picture's edge.
    if (fog instanceof Fog) {
      const haze = hazeOf(
        camera.position,
        rig.getTarget(looked),
        rig.polarAngle,
        rig.distance,
        box,
      );
      fog.near = haze.near;
      fog.far = haze.far;
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
    framing.keepIn(rig);
  });

  // The free room between the bars: the framed ground sits in its middle, whatever the camera does.
  useGlidingMiddle(
    camera,
    size,
    free,
    {
      still,
      // A held arrow holds the view still, whatever the bars do, until it is let go.
      held: arrowHeld ? ARROW_HOLD : heldView,
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
    if (lidar) rig.maxPolarAngle = Math.min(rig.maxPolarAngle, LIDAR_TILT_MAX);
    // A picked view is flown to (faded with Reduce Motion); the first view is set at once.
    poseFor(view, !still && was !== null && was.view !== view, was !== null && was.view !== view);
  });

  // A frame the page asks for keeps the person's own turn and tilt: only a new view poses them.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new close is what asks for the frame
  useEffect(() => {
    if (frameOn !== null) poseFor(view, !still, true, false);
  }, [frameOn]);
  useLookHeight(controls, posed, framing.lookUp, fit?.upM ?? 0, still, arrowHeld, invalidate);
  // The camera holds still while a finger aims a corner, and while an arrow on the model is held.
  const holds = useRef({ aim: false, arrow: false }).current;
  const holdFor = (part: 'aim' | 'arrow', holding: boolean) => {
    holds[part] = holding;
    const rig = controls.current;
    if (rig !== null) rig.enabled = !(holds.aim || holds.arrow);
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: the arrow's hold is what moves it
  useEffect(() => holdFor('arrow', arrowHeld), [arrowHeld]);
  useArrowPressHold(map, arrowHeld, holds, holdFor);

  // LiDAR keeps the view to a tilt its scan reads at: opened from a low camera, it rises to it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: LiDAR turning on or off is what moves it
  useEffect(() => {
    const rig = controls.current;
    if (rig === null || posed.current === null) return;
    bindHands(rig, view === 'top');
    // LiDAR's limits are the scan's whole ground, not the picture's: worked afresh either way.
    framing.reset(rig);
    if (!lidar || view === 'top') return;
    rig.maxPolarAngle = Math.min(rig.maxPolarAngle, LIDAR_TILT_MAX);
    if (framing.tiltOf(rig) <= LIDAR_TILT_MAX) return;
    const before = cameraEnd(rig);
    void rig.rotateTo(rig.azimuthAngle, POSE['3d'].tilt, !still);
    fadeIfMoved(rig, before);
    invalidate();
  }, [lidar]);

  // The sun's bar opened out of the top view frames the day's path; closed, the view frames the
  // roofs again.
  const sunShown = sun !== null && view !== 'top';
  const sunWas = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the sun's view opening or closing is what moves it
  useEffect(() => {
    const was = sunWas.current;
    sunWas.current = sunShown;
    if (posed.current === null || was === sunShown) return;
    if (sun !== null && sunShown) poseSun(sun, !still);
    else poseFor(view, !still);
  }, [sunShown]);

  const fadeIfMoved = (rig: CameraControlsImpl, before: CameraEnd) => {
    if (still) fadeIfMovedFrom(map, rig, before);
  };

  /**
   * The view framed round the roofs, or round the pin before a roof, flown to or set at once;
   * `turn`: turned and tilted to the view's own pose, else kept as the person left it.
   */
  const poseFor = (to: StudioView, move: boolean, fade = true, turn = true) => {
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
    const { upM, ...middle } = fitMiddle(fit);
    flyTo(rig, {
      distance: spread === null ? 0 : distance,
      going: distance,
      at: new Vector3(middle.east, upM, -middle.north),
      tilt: poseTilt(to, lidar, turn, framing.tiltOf(rig)),
      turn: turn ? POSE[to].turn : null,
      move,
      fade,
    });
  };

  /** Flies the camera to a frame (`camera-framing.ts`), faded with Reduce Motion. */
  const flyTo = (rig: CameraControlsImpl, to: FrameTo & { readonly fade: boolean }) => {
    const before = cameraEnd(rig);
    framing.flyTo(rig, to);
    if (to.fade) fadeIfMoved(rig, before);
    invalidate();
  };

  /** The sun's view: the day's path framed whole, arching over the roofs against the sky. */
  const poseSun = (frame: SunFrame, move: boolean) => {
    const rig = controls.current;
    if (rig === null) return;
    const pose = sunViewOf(frame, size, free, box);
    flyTo(rig, {
      distance: pose.distance,
      going: pose.distance,
      at: new Vector3(pose.at.east, pose.at.upM, -pose.at.north),
      tilt: pose.tilt,
      turn: pose.turn,
      move,
      fade: true,
    });
  };

  // The page's own controls: each moves the camera as a gesture would, inside the same limits.
  useEffect(() => {
    drive.current = driveOf({
      rig: () => controls.current,
      camera,
      map,
      size,
      still,
      fadeIfMoved,
      hold: (holding) => holdFor('aim', holding),
      drawRound: (square, into) => lens.draw(gl, scene, camera, size, square, into),
    });
  });

  return (
    <CameraControls ref={controls} makeDefault smoothTime={still ? 0 : FLY_SECONDS} dollyToCursor />
  );
}
