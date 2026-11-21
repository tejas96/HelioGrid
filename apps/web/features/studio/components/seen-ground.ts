'use client';
import type { GroundBox } from '@heliogrid/domain';
import { MathUtils, type PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from 'three';

/**
 * In a tilted view the sharp tiles cover the ground near where the camera looks, this many times
 * what a view straight down would see from as far; the ground beyond wears the first picture.
 */
const FOCUS_ROOM = 1.5;
const RADIANS = MathUtils.DEG2RAD;
/** The four corners of the window, as the camera names them. */
const WINDOW_CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const;

const overlap = (a: GroundBox, b: GroundBox): GroundBox => ({
  west: Math.max(a.west, b.west),
  east: Math.min(a.east, b.east),
  south: Math.max(a.south, b.south),
  north: Math.min(a.north, b.north),
});

/** A box grown to hold a point of the scene's ground; an empty one becomes the point. */
const grown = (box: GroundBox | null, x: number, z: number): GroundBox =>
  box === null
    ? { west: x, east: x, south: -z, north: -z }
    : {
        west: Math.min(box.west, x),
        east: Math.max(box.east, x),
        south: Math.min(box.south, -z),
        north: Math.max(box.north, -z),
      };

/** What a camera sees of the ground: where sharp tiles are wanted, and how far and wide it looks. */
export interface SeenGround {
  /** The ground near where the camera looks, in metres from the pin as the scene lies. */
  readonly sharp: GroundBox;
  /** How far the camera stands from where its middle looks. */
  readonly distance: number;
  /** The ground a view straight down sees from one metre up, from its middle to its top. */
  readonly down: number;
}

/**
 * A reader of the ground a camera sees: the window's corners cast onto the ground, kept to the
 * ground near where its middle looks. It answers `null` when the camera looks past the horizon.
 */
export function seenGroundReader(): (
  camera: PerspectiveCamera,
  aspect: number,
  all: GroundBox,
) => SeenGround | null {
  const caster = new Raycaster();
  const ground = new Plane(new Vector3(0, 1, 0), 0);
  const at = new Vector2();
  const hit = new Vector3();
  /** Where a point of the window falls on the ground; `null` past the horizon. */
  const cast = (camera: PerspectiveCamera, x: number, y: number): Vector3 | null => {
    caster.setFromCamera(at.set(x, y), camera);
    return caster.ray.intersectPlane(ground, hit);
  };
  /** The ground between the window's four corners; `null` when one looks past the horizon. */
  const windowOf = (camera: PerspectiveCamera): GroundBox | null => {
    let seen: GroundBox | null = null;
    for (const [x, y] of WINDOW_CORNERS) {
      const corner = cast(camera, x, y);
      if (corner === null) return null;
      seen = grown(seen, corner.x, corner.z);
    }
    return seen;
  };
  return (camera, aspect, all) => {
    const middle = cast(camera, 0, 0);
    if (middle === null) return null;
    const centre = { east: middle.x, north: -middle.z };
    const distance = camera.position.distanceTo(middle);
    const down = Math.tan((camera.fov / 2) * RADIANS);
    const near = distance * down * Math.max(1, aspect) * FOCUS_ROOM;
    const focus = {
      west: centre.east - near,
      east: centre.east + near,
      south: centre.north - near,
      north: centre.north + near,
    };
    // A window that sees past the horizon sees to the end of the ground.
    return { sharp: overlap(windowOf(camera) ?? all, focus), distance, down };
  };
}
