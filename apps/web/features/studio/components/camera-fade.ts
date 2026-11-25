import { cssEasing, theme } from '@heliogrid/theme';
import type CameraControlsImpl from 'camera-controls';
import { Vector3 } from 'three';

/** The fade running on each layer: a move during it never starts the layer from blank again. */
const running = new WeakMap<HTMLElement, Animation>();

/**
 * With Reduce Motion the studio's camera never travels, and a move never jumps either
 * (`T-M05-002`, *Look and motion*): the map and its marks fade in where the camera now is, over
 * the one duration reduced motion keeps. A held key or quick presses keep the one fade running.
 */
export function fadeInPlace(canvas: HTMLElement) {
  const studio = canvas.closest('.hg-studio');
  const layers = studio?.querySelectorAll<HTMLElement>('.hg-studio-scene, .hg-roof-marks') ?? [];
  for (const layer of layers) {
    if (running.get(layer)?.playState === 'running') continue;
    running.set(
      layer,
      layer.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: theme.motion.durations.fade,
        easing: cssEasing(theme.motion.easings.standard),
      }),
    );
  }
}

/** A camera that ends within a millimetre of where it was did not move: nothing fades. */
const MOVED_M = 1e-3;

/** Where the camera is going: its position and its target once the move in hand ends. */
export type CameraEnd = readonly [Vector3, Vector3];

export function cameraEnd(rig: CameraControlsImpl): CameraEnd {
  return [rig.getPosition(new Vector3()), rig.getTarget(new Vector3())];
}

/**
 * The fade after a move the page made, only when the camera really moved: a zoom at its limit or
 * a move against the boundary changes nothing, so blinks not.
 */
export function fadeIfMovedFrom(canvas: HTMLElement, rig: CameraControlsImpl, before: CameraEnd) {
  const after = cameraEnd(rig);
  if (after.some((end, i) => end.distanceTo(before[i] as Vector3) > MOVED_M)) fadeInPlace(canvas);
}

/**
 * The camera is still on its way to a pose the page asked for: where it is now is not where it
 * lands. Read from the two ends, never the library's `active`, which stays on at rest.
 */
export function inFlight(rig: CameraControlsImpl): boolean {
  const [goingTo, lookingAt] = cameraEnd(rig);
  const now = rig.getPosition(new Vector3(), false);
  const aim = rig.getTarget(new Vector3(), false);
  return now.distanceTo(goingTo) > MOVED_M || aim.distanceTo(lookingAt) > MOVED_M;
}
