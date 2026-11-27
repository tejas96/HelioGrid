import type { GroundPoint } from '@heliogrid/domain';
import type CameraControlsImpl from 'camera-controls';
import { type PerspectiveCamera, Plane, Raycaster, Spherical, Vector2, Vector3 } from 'three';
import { type CameraEnd, cameraEnd } from './camera-fade';
import { groundPerPixel } from './camera-limits';

/** What the page's own controls ask of the camera: the zoom buttons and the arrow keys. */
export interface StudioDrive {
  zoomIn(): void;
  zoomOut(): void;
  /** One arrow key's move: `east` and `north` are each -1, 0 or 1. */
  nudge(east: number, north: number): void;
  /**
   * Where a point of the page, in client pixels, falls on the level `height` metres above the
   * ground: the pointer cast onto the ground, in the top view and in 3D. `null` past the horizon.
   */
  groundAt(clientX: number, clientY: number, height: number): GroundPoint | null;
  /** While a finger aims a corner, the map holds still under it. */
  hold(still: boolean): void;
  /**
   * The scene round a point of the page, drawn again into `into` at its own size: `span` CSS
   * pixels of the page across the whole of it. The loupe's picture — drawn for it, sharper than
   * the screen under the finger, never copied off the screen.
   */
  drawRound(clientX: number, clientY: number, span: number, into: HTMLCanvasElement): void;
}

/** Each press of Zoom in or Zoom out moves the camera this many times nearer or farther. */
const ZOOM_STEP = 1.6;
/** Each arrow key moves the map this share of the window. */
const ARROW_SHARE = 0.15;

/** What the page's controls move: the rig, its camera and canvas, and the rig's own acts. */
interface DriveParts {
  readonly rig: () => CameraControlsImpl | null;
  readonly camera: PerspectiveCamera;
  readonly map: HTMLCanvasElement;
  readonly size: { readonly width: number; readonly height: number };
  readonly still: boolean;
  /** Under Reduce Motion a move that jumped the view fades it in (`camera-fade.ts`). */
  readonly fadeIfMoved: (rig: CameraControlsImpl, before: CameraEnd) => void;
  readonly hold: (holding: boolean) => void;
  /** The loupe's picture of the scene round a square of the canvas, in its pixels. */
  readonly drawRound: (
    square: { readonly left: number; readonly top: number; readonly side: number },
    into: HTMLCanvasElement,
  ) => void;
}

/** The page's own controls on the camera: each moves it as a gesture would, inside its limits. */
export function driveOf(parts: DriveParts): StudioDrive {
  const { camera, map, size, still, fadeIfMoved } = parts;
  // The pointer's line cast onto a level, worked in these each time.
  const caster = new Raycaster();
  const pointer = new Vector2();
  const level = new Plane(new Vector3(0, 1, 0), 0);
  const landed = new Vector3();
  const going = new Spherical();
  const zoomBy = (factor: number) => {
    const rig = parts.rig();
    if (rig === null) return;
    const before = cameraEnd(rig);
    // Each press counts from where the last one is taking the camera: quick presses add up.
    void rig.dollyTo(rig.getSpherical(going, true).radius * factor, !still);
    fadeIfMoved(rig, before);
  };
  return {
    zoomIn: () => zoomBy(1 / ZOOM_STEP),
    zoomOut: () => zoomBy(ZOOM_STEP),
    nudge: (east, north) => {
      const rig = parts.rig();
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
    hold: parts.hold,
    drawRound: (clientX, clientY, span, into) => {
      const box = map.getBoundingClientRect();
      const square = {
        left: clientX - box.left - span / 2,
        top: clientY - box.top - span / 2,
        side: span,
      };
      parts.drawRound(square, into);
    },
  };
}
