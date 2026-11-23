import type { RoofList, RoofScene, RoofTopMark } from '@heliogrid/domain';

/** What the studio's kernel works out of the design drawn, for the screen to draw. */
export interface RoofModelShown {
  /** The 3D model: the scene's solids and faces, and each roof's foot and top. */
  readonly scene: RoofScene;
  /** Each roof's marks in the top view: its sides' walls, its dots, and what waits for a look. */
  readonly topMarks: readonly RoofTopMark[];
  /** Roofs, the one sheet: a row for each roof, and what waits for a person to check. */
  readonly roofList: RoofList;
  /** The area of every roof together, every spot once as seen from above, in square metres. */
  readonly roofsAreaM2: number;
}
