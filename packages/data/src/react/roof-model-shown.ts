import type {
  RoofList,
  RoofScene,
  RoofSheetRows,
  RoofTopMark,
  SideSheetRows,
  StairsShown,
} from '@heliogrid/domain';

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
  /** The open roof's sheet, row by row; `null` with no sheet open. */
  readonly sheetRows: RoofSheetRows | null;
  /** The open side's sheet; `null` with no side open. */
  readonly sideRows: SideSheetRows | null;
  /** Where the stairs reach the roof, and their clear strip — where a drag holds them, there. */
  readonly stairs: StairsShown | null;
  /** No stairs, none guessed, and not skipped: the bar asks where they reach the roof. */
  readonly stairsAsk: boolean;
}
