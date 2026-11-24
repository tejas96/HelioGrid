import type {
  CornerRef,
  DraftView,
  FocusJob,
  GroundPoint,
  Guide,
  HeldCircle,
  KindLine,
  LengthEntry,
  LengthSlide,
  labelLayoutOf,
  MeetChoice,
  NumberEntry,
  RoofBar,
  RoofGrip,
  RoofHandles,
  RoofHeightShown,
  RoofMarksView,
  RoofStepEvent,
  RoofStepState,
  StudioDocument,
  screenProjector,
  TypedRefusal,
  tagPlaceOf,
} from '@heliogrid/domain';

/** The roof step's moves (`T-M05-002`, part b): drawing, the length box, and the fixes on a roof. */
export interface RoofMoves {
  /** Draw a roof: the pencil, Draw myself, Draw on the grid, or + for another roof. */
  draw(): void;
  /** The magnet turned on or off: the pick follows the person to every device. */
  toggleMagnet(): void;
  /** Alt held or let go on a desktop: the magnet rests while it is held. */
  drawFree(free: boolean): void;
  /** The magnet's pick sent again, after its save was refused. */
  retryMagnet(): void;
  /** The trash while drawing: every corner goes, drawing goes on; Undo brings them back. */
  wipe(): void;
  /** The trash on a picked roof: it goes, as one change; Undo brings it back. */
  deleteRoof(): void;
  /** The pointer over the ground while drawing; `null` when it leaves. */
  hover(at: GroundPoint | null): void;
  /** A tap on the ground: a corner while drawing, else it lets a picked corner go. */
  tap(at: GroundPoint): void;
  /** Close shape: with three square corners, the ghost gives the fourth. */
  close(): void;
  /** A tap on the first corner: the shape closes as drawn, a triangle from three. */
  closeAsDrawn(): void;
  /**
   * The filled pencil, Esc, × on the length box: what is in hand goes, the design stays. A drawing
   * stopped with corners leaves them for one Undo.
   */
  cancel(): void;
  pickLength(roof: number, edge: number): void;
  typeLength(entry: LengthEntry): void;
  /** The slider moved, or − or + on the length: the length in hand, in metres. */
  slideLength(metres: number): void;
  /** The slider or the box: the pick follows the person to every device. */
  chooseNumberEntry(entry: NumberEntry): void;
  stepLength(by: 1 | -1): void;
  setLength(): void;
  /** The answer to "the picture shows about …": use the typed length, or change it. */
  confirmLength(use: boolean): void;
  grab(grip: RoofGrip, at: GroundPoint): void;
  drag(at: GroundPoint): void;
  release(): void;
  pickCorner(corner: CornerRef | null): void;
  /**
   * An arrow key on a move or turn handle: one step east, west, north or south (`x`, `y` of −1, 0,
   * 1), or one degree's turn left or right. Each press is one change.
   */
  nudgeRoof(roof: number, kind: 'move' | 'turn', x: number, y: number): void;
  removeCorner(): void;
  /** Type the size (part c): the card opens at the market's start size. */
  typeSize(): void;
  /** A number in the card typed in its box. */
  typeSizeEntry(which: 'length' | 'width', entry: LengthEntry): void;
  /** A number in the card slid, or stepped by − or +: in metres. */
  slideSize(which: 'length' | 'width', metres: number): void;
  /** The desktop's one box: `13.2x8.6`. */
  typeSizePair(text: string): void;
  /** Place roof: the rectangle stands as one change. */
  placeRoof(): void;
}

/** What places a roof when it closes: how its outline meets the design's roofs, and the market's facts. */
export type ClosePlacing = NonNullable<Extract<RoofStepEvent, { kind: 'close' }>['placing']>;

/** A roof's place among the others (`T-M05-002`, part e): its chips, and Copy and Delete from its row. */
export interface RoofPlaceMoves {
  /** A chip on the line after a roof closes: a kind to make it, Join, or Cut to edge. */
  chooseKind(choice: MeetChoice): void;
  /** A side's dot on the picked roof: its wall is added, or taken off. */
  toggleSideWall(roof: number, side: number): void;
  /** Copy, from a roof's row: a copy beside it with what stands on it, picked to drag. */
  copyRoof(roof: number): void;
  /** Delete, from a roof's row: it goes with what stands on it. */
  deleteRoofAt(roof: number): void;
}

/** The size card (part c) as the screen draws it. */
export interface SizeCardView {
  readonly length: LengthEntry;
  readonly width: LengthEntry;
  /** Each number in metres; `null` while its box holds no length. */
  readonly lengthM: number | null;
  readonly widthM: number | null;
  /** The desktop's one box as typed; `null` when the boxes or sliders hold the numbers. */
  readonly pair: string | null;
  /** Place roof would place it now: both numbers good and the rectangle free to stand. */
  readonly placeable: boolean;
  /** Why it cannot be placed; `null` when it can, or while a box is empty. */
  readonly refusal: TypedRefusal | null;
  /**
   * The rectangle to draw dashed — its corners, each edge's length, its middle and its area — or
   * `null` while a number is missing or unreadable.
   */
  readonly preview: {
    readonly corners: readonly GroundPoint[];
    readonly lengths: readonly number[];
    readonly middle: GroundPoint;
    readonly area: number;
    /** Each length no person set yet — the market's start size — reads as "about". */
    readonly about: readonly boolean[];
  } | null;
  /** The preview cannot stand there: it is drawn in the error colour. */
  readonly previewBad: boolean;
  /** The sliders' ends and step, in metres, and the market's start size marked on each track. */
  readonly slide: {
    readonly min: number;
    readonly max: number;
    readonly step: number;
    readonly mark: { readonly length: number; readonly width: number };
  };
  /**
   * The numbers are in boxes: the person's pick, or a size past the sliders' ends, which a slider
   * would cut. On a phone the keyboard then covers the foot, and Place roof moves into the card.
   */
  readonly boxes: boolean;
  /**
   * A number the sliders cannot show — past their ends, or not a number yet: the switch back to
   * them rests until the boxes hold a length between the ends.
   */
  readonly outside: boolean;
}

/** What the roof step draws: the screen's view model of it. */
export interface RoofStepView {
  /** The roof step in hand: drawing, a length in the box, a drag, or none. */
  readonly roofStep: RoofStepState;
  /** The job in hand, for focus mode: every part the job does not use steps aside. */
  readonly job: FocusJob;
  /** The magnet as the person picked it, for its switch; Alt does not change it. */
  readonly magnet: boolean;
  /** The last save of the magnet's pick was refused: the pick shows here, and is not kept. */
  readonly magnetRefused: boolean;
  /** The design to draw: the design, or the preview of what is in hand. */
  readonly shown: StudioDocument | null;
  /** The height a roof on the ground starts at where none is set: the market's plinth and a storey. */
  readonly startHeightM: number;
  /** Each roof's height as it stands, in the order of `shown`'s roofs: its own, or its start. */
  readonly heights: readonly RoofHeightShown[];
  /** Each roof's marks, from the design drawn. */
  readonly roofMarks: readonly RoofMarksView[];
  /** The roof being drawn, while drawing. */
  readonly draft: DraftView | null;
  readonly bar: RoofBar | null;
  /** The line after a new roof closes: what it became, and its chips; `null` once it has left. */
  readonly kindLine: KindLine | null;
  /** − or + on the length in the box would be refused: the button dims. */
  readonly stepOff: { readonly less: boolean; readonly more: boolean };
  /** The length in the box: the edge's traced length, the typed one, and whether it sizes all. */
  /** Type the size's card (part c), while it is open. */
  readonly sizeCard: SizeCardView | null;
  readonly lengthBox: {
    readonly traced: number;
    readonly typed: number | null;
    readonly first: boolean;
    /** The slider's ends, its step and the picture's mark on its track. */
    readonly slide: LengthSlide;
  } | null;
  /** How the person sets a number: the slider first, or a box (`T-M05-002`, *Values*). */
  readonly numberEntry: NumberEntry;
  /** Where each length's label sits on the screen: along its edge, out past a short one. */
  readonly layoutLabels: typeof labelLayoutOf;
  /** Where a tag beside a spot sits: on the side that keeps its words whole on the screen. */
  readonly placeTag: typeof tagPlaceOf;
  /**
   * Where the scene's points land on the screen for a camera as it stands now: every mark the page
   * keeps on the model is placed through it, in the frame being drawn (`T-M05-002`, part e).
   */
  readonly screenProjector: typeof screenProjector;
  /** The picked corner's angle, in whole degrees. */
  readonly pickedAngle: number | null;
  /** The guide lines a corner in hand is held on, drawn dashed across the map. */
  readonly guides: readonly Guide[];
  /** Where a drag's tag sits. */
  readonly dragTagAt: GroundPoint | null;
  /** The roof as it stood before the drag in hand: a turn's or a move's start, or where a refused
   * drag goes back to. */
  readonly dragBefore: readonly GroundPoint[] | null;
  /** The corner a drag holds, dragged or added by a +: its dot is the hot one. */
  readonly heldCorner: CornerRef | null;
  /** The set length a corner drag keeps: its corner runs on this circle. */
  readonly heldCircle: HeldCircle | null;
  /** The roof whose + dots and handles show; every roof keeps its corners. */
  readonly handlesRoof: number | null;
  /** Where a roof's move and turn handles sit, `gap` metres apart. */
  handlesOf(roof: number, gap: number): RoofHandles | null;
  /** The corner of a roof nearest a point on the ground: crowded dots hand on the one meant. */
  cornerNearest(roof: number, at: GroundPoint): number;
}
