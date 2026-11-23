import type {
  LengthsMeasured,
  NumberAt,
  ParapetBuild,
  RoofKind,
  RoofNumber,
  RoofNumberShown,
  RoofNumberTyped,
  RoofShape,
} from '@heliogrid/domain';

/**
 * A roof's sheet beyond its height, and a side's sheet (`T-M05-002`, part e): the view model's
 * types, apart from the hook that asks the roof kernel (`use-roof-sheet-rows.ts`).
 */

/** The rows of a roof's sheet a phone opens one at a time. */
export type SheetRowKey =
  | 'kind'
  | 'material'
  | 'details'
  | 'shape'
  | 'height'
  | 'slope'
  | 'parapet'
  | 'setback'
  | 'stairs'
  | RoofNumber;

/** Which sheet shows over the roof: its own, one side's, or its parapet's details. */
export type SheetPart =
  | { readonly kind: 'roof' }
  | { readonly kind: 'side'; readonly side: number }
  | { readonly kind: 'details' };

export interface RoofSheetRowsState {
  readonly sheetPart: SheetPart;
  /** On a phone, the one row open; `null` with every row closed. */
  readonly rowOpen: SheetRowKey | null;
  /** A number moving on its slider, not kept yet: the model shows it. */
  readonly numberInHand: { readonly at: NumberAt; readonly value: number } | null;
  /** A number as its box takes it, in the reader's units. */
  numberTyped(shown: RoofNumberShown): RoofNumberTyped;
}

export interface RoofSheetRowMoves {
  /** A row tapped on a phone: it opens and the one open closes; tapped again, it closes. */
  openRow(key: SheetRowKey | null): void;
  /** A number's slider moved: the model follows; nothing is kept yet. */
  slideNumber(key: RoofNumber, value: number): void;
  /** The slider let go: the number in hand is kept as one change. */
  keepNumber(): void;
  /** A number typed, or stepped by − and +: kept at once. */
  setNumber(key: RoofNumber, value: number): void;
  /** The reset: the studio's value comes back, or on a side the roof's. */
  resetNumber(key: RoofNumber): void;
  pickShape(shape: RoofShape): void;
  /** What it is: the roof made into another kind. */
  makeKind(kind: RoofKind): void;
  setParapetAllRound(on: boolean): void;
  setParapetBuilt(build: ParapetBuild): void;
  setLengthsMeasured(to: LengthsMeasured): void;
  /** A side tapped on the model: it lights, and its sheet shows in the roof's place. */
  openSide(side: number): void;
  /** Parapet details, as its own short sheet. */
  openDetails(): void;
  /** Back: from a side's sheet or Parapet details to the roof's. */
  backToRoof(): void;
  /** The open side's parapet, on or off; a person's from then on. */
  setSideWall(on: boolean): void;
  /** The open side's parapet handed back to the roof's setting. */
  sideWallFollows(): void;
  /** The open side made the shed's low side, or the side the glass faces. */
  markSide(mark: 'low' | 'glass'): void;
  /** The open end made a gable end or a hip. */
  endSide(end: 'gable' | 'hip'): void;
  /** A gable's ridge turned 90°, or back. */
  turnRidge(): void;
  /** A tap on a roof's ridge: a gable's turns; `false` where the ridge does not turn. */
  turnRidgeOf(roof: number): boolean;
  /** The open side's wall arrow taken, its parapet height as it stands. */
  grabWall(metres: number): void;
  /**
   * The wall arrow moved by how far the pointer rose, in metres: the side's parapet height
   * follows. With the magnet on, a height within `reachM` of a level that exists pulls to it.
   */
  dragWall(risenM: number, reachM?: number): void;
  /** The ridge's arrow taken, the ridge's height over the low edge and the slope as they stand. */
  grabRidge(riseM: number, slopeDeg: number): void;
  /** The ridge arrow moved by how far the pointer rose: the slope follows, its run kept. */
  dragRidge(risenM: number, reachM?: number): void;
  /** Undo with a number in hand puts it back first; `true` when there was one. */
  dropNumber(): boolean;
}
