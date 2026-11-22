import type { GroundPoint } from '@heliogrid/domain';

/** What the page's own controls ask of the camera: the zoom buttons, Back to the pin, the arrow keys. */
export interface StudioDrive {
  zoomIn(): void;
  zoomOut(): void;
  /** The view as it opens: the roofs framed, or the pin in the middle before a roof. */
  home(): void;
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
