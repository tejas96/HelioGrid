import { describe, expect, it } from 'vitest';
import { type CameraPose, screenProjector } from '../../src/studio/screen-point';

const SIZE = { width: 800, height: 400 };
const HALF_FOV = (22.5 * Math.PI) / 180;
const NEAR = 1;
const FAR = 500;
const SQRT_HALF = Math.SQRT1_2;

/** A perspective projection as the scene's camera holds it: sixteen numbers, column by column. */
function perspective(): number[] {
  const top = NEAR * Math.tan(HALF_FOV);
  const right = top * (SIZE.width / SIZE.height);
  return [
    NEAR / right,
    0,
    0,
    0,
    0,
    NEAR / top,
    0,
    0,
    0,
    0,
    -(FAR + NEAR) / (FAR - NEAR),
    -1,
    0,
    0,
    (-2 * FAR * NEAR) / (FAR - NEAR),
    0,
  ];
}

/** How many pixels from the middle a point this far off the camera's line lands, at this depth. */
const acrossPx = (metres: number, depth: number) =>
  (metres / depth / (Math.tan(HALF_FOV) * (SIZE.width / SIZE.height))) * (SIZE.width / 2);
const upPx = (metres: number, depth: number) =>
  (metres / depth / Math.tan(HALF_FOV)) * (SIZE.height / 2);

/** A camera 50 m over the pin looking straight down, north up — the top view. */
function lookingDown() {
  return {
    position: { x: 0, y: 50, z: 0 },
    quaternion: { x: -SQRT_HALF, y: 0, z: 0, w: SQRT_HALF },
    projection: perspective(),
  };
}

describe('where a scene point lands on the screen', () => {
  it('puts the point under the camera in the middle of the screen', () => {
    const at = screenProjector(lookingDown(), SIZE)(0, 0, 0);
    expect(at?.x).toBeCloseTo(400, 6);
    expect(at?.y).toBeCloseTo(200, 6);
  });

  it('puts east to the right and north up, by the share of the view each covers', () => {
    const project = screenProjector(lookingDown(), SIZE);
    const east = project(10, 0, 0);
    expect(east?.x).toBeCloseTo(400 + acrossPx(10, 50), 6);
    expect(east?.y).toBeCloseTo(200, 6);
    // North is the scene's −z.
    const north = project(0, 0, -10);
    expect(north?.x).toBeCloseTo(400, 6);
    expect(north?.y).toBeCloseTo(200 - upPx(10, 50), 6);
  });

  it('follows a turned camera: from the east, north lies to the right and height up', () => {
    const pose: CameraPose = {
      position: { x: 50, y: 0, z: 0 },
      quaternion: { x: 0, y: SQRT_HALF, z: 0, w: SQRT_HALF },
      projection: perspective(),
    };
    const project = screenProjector(pose, SIZE);
    expect(project(0, 0, 0)?.x).toBeCloseTo(400, 6);
    expect(project(0, 0, -10)?.x).toBeCloseTo(400 + acrossPx(10, 50), 6);
    expect(project(0, 10, 0)?.y).toBeCloseTo(200 - upPx(10, 50), 6);
  });

  it('places a mark with the camera of the frame being drawn, not the frame before', () => {
    // The scene's camera is one object its controls move in place, as here.
    const camera = lookingDown();
    const before = screenProjector(camera, SIZE);
    camera.position.x = 10;
    const now = screenProjector(camera, SIZE);
    // The model is drawn from where the camera stands now: the pin sits left of the middle.
    expect(now(0, 0, 0)?.x).toBeCloseTo(400 - acrossPx(10, 50), 6);
    // A place worked out for the earlier frame stays that frame's, so the two never mix.
    expect(before(0, 0, 0)?.x).toBeCloseTo(400, 6);
  });

  it('follows the turn the controls gave the camera this frame', () => {
    const camera = lookingDown();
    // Turned to look from the east, as an orbit leaves it, with no matrix refreshed in between.
    camera.position = { x: 50, y: 0, z: 0 };
    camera.quaternion = { x: 0, y: SQRT_HALF, z: 0, w: SQRT_HALF };
    expect(screenProjector(camera, SIZE)(0, 10, 0)?.y).toBeCloseTo(200 - upPx(10, 50), 6);
  });

  it('gives no place to a point behind the camera or past its far reach', () => {
    const project = screenProjector(lookingDown(), SIZE);
    expect(project(0, 60, 0)).toBeNull();
    expect(project(0, 50, 0)).toBeNull();
    expect(project(0, -FAR, 0)).toBeNull();
  });
});
