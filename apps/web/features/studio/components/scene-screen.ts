import type { StudioScreen } from '@heliogrid/data/react';
import type { ScreenProjector } from '@heliogrid/domain';
import type { Camera } from 'three';

/** The studio's maths for where a scene point lands on the screen, handed down by its hook. */
export type SceneScreen = StudioScreen['screenProjector'];

/**
 * Where the scene's points land on the screen in the frame being drawn (`T-M05-002`, part e).
 * Every mark the page keeps on the model is placed through here. The camera's controls move it
 * before each frame, but its view matrix is refreshed only when the frame is drawn, so a mark
 * placed with `Vector3.project` before the draw trails the model by a frame; this reads where the
 * camera stands and how it is turned now.
 */
export function screenOfFrame(
  screen: SceneScreen,
  camera: Camera,
  size: { readonly width: number; readonly height: number },
): ScreenProjector {
  return screen(
    {
      position: camera.position,
      quaternion: camera.quaternion,
      projection: camera.projectionMatrix.elements,
    },
    size,
  );
}
