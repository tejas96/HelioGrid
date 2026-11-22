import type {
  CornerRef,
  DraftView,
  FocusJob,
  GroundPoint,
  Guide,
  HeldCircle,
  LengthEntry,
  LengthSlide,
  labelLayoutOf,
  MeasurementSystem,
  NumberEntry,
  RoofBar,
  RoofGrip,
  RoofHandles,
  RoofHeightShown,
  RoofMarksView,
  RoofStepState,
  StudioDocument,
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
  /** Redraw, just after a close: that roof goes and drawing starts again. */
  redraw(): void;
  /** Done, just after a close: the ask goes away, the roof stays. */
  keepClosed(): void;
  /** The trash on a picked roof: it goes, as one change; Undo brings it back. */
  deleteRoof(): void;
  /** The pointer over the ground while drawing; `null` when it leaves. */
  hover(at: GroundPoint | null): void;
  /** A tap on the ground: a corner while drawing, else it lets a picked corner go. */
  tap(at: GroundPoint): void;
  /** Close shape, or a tap on the first corner. */
  close(): void;
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
  /** m or ft on the length box: the reader's units change, and the box keeps its length. */
  lengthUnits(system: MeasurementSystem): void;
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
  /** Each roof's height as it stands, in the order of `shown`'s roofs: its own, or the storey's. */
  readonly heights: readonly RoofHeightShown[];
  /** Each roof's marks, from the design drawn. */
  readonly roofMarks: readonly RoofMarksView[];
  /** The roof being drawn, while drawing. */
  readonly draft: DraftView | null;
  readonly bar: RoofBar | null;
  /** − or + on the length in the box would be refused: the button dims. */
  readonly stepOff: { readonly less: boolean; readonly more: boolean };
  /** The length in the box: the edge's traced length, the typed one, and whether it sizes all. */
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
