import type { GroundBox } from './ground';

/**
 * How much ground the studio's camera shows once it tilts (`T-M05-002a`): the frame's corners cast
 * onto the ground, so the camera stops before the picture's edge comes into view, and the haze
 * that takes the ground before that edge.
 */

/** The camera's frame as the tangents of its half angles: across the window, and up and down the room between the bars. */
export interface ViewSpread {
  readonly across: number;
  readonly along: number;
}

/**
 * The farthest ground the view shows from the point it looks at, per metre the camera stands from
 * that point, whichever way it is turned: each corner of the frame cast onto the ground, cut at
 * `clearDepth` camera distances deep, past which the haze has taken the ground. `tilt` is in
 * radians from straight down; a corner that looks over the horizon is cut at the haze too.
 */
export function groundReachPerMetre(tilt: number, spread: ViewSpread, clearDepth: number): number {
  const sin = Math.sin(tilt);
  const cos = Math.cos(tilt);
  let reach = 0;
  for (const up of [-1, 1]) {
    for (const side of [-1, 1]) {
      // The corner's line of sight, one step deep per unit: ahead, up or down the room, to the side.
      const ahead = sin + up * spread.along * cos;
      const down = cos - up * spread.along * sin;
      const out = side * spread.across;
      // The camera stands `cos` up and `sin` behind the point it looks at.
      const deep = Math.min(down > 0 ? cos / down : Number.POSITIVE_INFINITY, clearDepth);
      reach = Math.max(reach, Math.hypot(deep * ahead - sin, deep * out));
    }
  }
  return reach;
}

/**
 * How deep the box's edge lies straight ahead of the camera, along its line of sight: the ground
 * where the camera's heading leaves the box, `heading` a unit step east and north. `null` looking
 * straight down, where nothing lies ahead; `0` where the heading never crosses the box.
 */
export function edgeDepthAhead(
  camera: { readonly east: number; readonly north: number; readonly up: number },
  heading: { readonly east: number; readonly north: number },
  tilt: number,
  box: GroundBox,
): number | null {
  const sin = Math.sin(tilt);
  if (sin <= 0) return null;
  const leave = (from: number, step: number, low: number, high: number) => {
    if (step === 0) return from >= low && from <= high ? Number.POSITIVE_INFINITY : 0;
    return ((step > 0 ? high : low) - from) / step;
  };
  const ahead = Math.min(
    leave(camera.east, heading.east, box.west, box.east),
    leave(camera.north, heading.north, box.south, box.north),
  );
  if (!Number.isFinite(ahead)) return null;
  return Math.max(0, ahead) * sin + camera.up * Math.cos(tilt);
}
