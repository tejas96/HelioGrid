'use client';
import {
  type CornerRef,
  type DraftView,
  type DrawHelpers,
  draftClosesAt,
  draftViewOf,
  dragTagAt,
  edgeLengths,
  entryMetres,
  entryOf,
  type FocusJob,
  type GroundPoint,
  type History,
  helpersOf,
  historyAfter,
  isStudioHelper,
  type LengthEntry,
  lengthIsFirst,
  type MeasurementSystem,
  pickedAngleOf,
  ROOF_STEP_START,
  type RoofBar,
  type RoofGrip,
  type RoofHandles,
  type RoofMarksView,
  type RoofStepEvent,
  type RoofStepState,
  roofBarOf,
  roofHandles,
  roofMarksOf,
  roofStepAfter,
  roofStepShown,
  type StudioDocument,
  type StudioHelper,
  stepRefused,
} from '@heliogrid/domain';
import { type RefObject, useRef, useState } from 'react';
import { aKey } from '../client/creation-key';
import type { StudioPicture } from './studio-document-state';

/** The roof step's moves (`T-M05-002`, part b): drawing, the length box, and the fixes on a roof. */
export interface RoofMoves {
  /** Draw a roof: the pencil, Draw myself, Draw on the grid, or + for another roof. */
  draw(): void;
  /** Square, Line up or Buildings turned on or off: the pick follows the person to every device. */
  toggleHelper(helper: StudioHelper): void;
  /** Alt held or let go on a desktop: every helper rests while it is held. */
  drawFree(free: boolean): void;
  /** The helper picks sent again, after their save was refused. */
  retryHelpers(): void;
  /** The pointer over the ground while drawing; `null` when it leaves. */
  hover(at: GroundPoint | null): void;
  /** A tap on the ground: a corner while drawing, else it lets a picked corner go. */
  tap(at: GroundPoint): void;
  /** Close shape, or a tap on the first corner. */
  close(): void;
  /** Cancel, Esc, × on the length box: what is in hand goes, the design stays. */
  cancel(): void;
  pickLength(roof: number, edge: number): void;
  typeLength(entry: LengthEntry): void;
  stepLength(by: 1 | -1): void;
  setLength(): void;
  /** The answer to "the picture shows about …": use the typed length, or change it. */
  confirmLength(use: boolean): void;
  grab(grip: RoofGrip, at: GroundPoint): void;
  drag(at: GroundPoint): void;
  release(): void;
  pickCorner(corner: CornerRef | null): void;
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
  /** The helpers as the person picked them, for their switches; Alt does not change these. */
  readonly helpers: DrawHelpers;
  /**
   * Building outlines are read for the site. Not before the height map is read (part g): until
   * then Buildings snaps to the design's other roofs alone, and a note says so.
   */
  readonly buildingData: boolean;
  /** The last save of the helper picks was refused: the pick shows here, and is not kept. */
  readonly helpersRefused: boolean;
  /** The design to draw: the design, or the preview of what is in hand. */
  readonly shown: StudioDocument | null;
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
  } | null;
  /** The picked corner's angle, in whole degrees. */
  readonly pickedAngle: number | null;
  /** Where a drag's tag sits. */
  readonly dragTagAt: GroundPoint | null;
  /** Where a roof's move and turn handles sit, `gap` metres apart. */
  handlesOf(roof: number, gap: number): RoofHandles | null;
}

/** The focus job of each roof-step state: a roof's sheet is the studio's own (`focus.ts`). */
const JOB_OF: Record<RoofStepState['kind'], FocusJob> = {
  idle: 'looking',
  drawing: 'drawing',
  sizing: 'sizing',
  dragging: 'dragging',
};

/**
 * The roof step's state and moves (`T-M05-002`, part b, Law 11): the reducer's state, each event
 * run over the design as it stands, and an act that ends committed as one change. The studio's
 * own hook holds the history and the save; this one only asks it to change.
 */
export function useRoofStep({
  document,
  latest,
  change,
  editable,
  units,
  picture,
  setUnits,
  helpersOff,
  setHelpersOff,
  helpersRefused,
}: {
  /** The design as it stands, as the screen last drew it. */
  document: StudioDocument | null;
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  editable: boolean;
  units: MeasurementSystem;
  picture: StudioPicture;
  setUnits: (system: MeasurementSystem) => void;
  /** The helpers the person turned off, as their account holds them. */
  helpersOff: readonly string[];
  setHelpersOff: (off: readonly StudioHelper[]) => void;
  helpersRefused: boolean;
}) {
  const [roofStep, setRoofStep] = useState<RoofStepState>(ROOF_STEP_START);
  const [free, setFree] = useState(false);
  const askedOff = useRef<readonly StudioHelper[] | null>(null);
  const step = useRef(roofStep);
  step.current = roofStep;

  /** One event of the roof step: its state moves, and an act that ends commits one change. */
  const act = (event: RoofStepEvent) => {
    const at = latest.current;
    if (!editable || at === null) return;
    const outcome = roofStepAfter(step.current, event, at.present);
    step.current = outcome.state;
    setRoofStep(outcome.state);
    if (outcome.commit !== null) change(historyAfter(at, outcome.commit));
  };

  const picked = helpersOf(helpersOff, false);
  const shown = document === null ? null : roofStepShown(roofStep, document, units);
  const sizing = roofStep.kind === 'sizing' ? roofStep : null;
  const view: RoofStepView = {
    roofStep,
    job: JOB_OF[roofStep.kind],
    helpers: picked,
    buildingData: false,
    helpersRefused,
    shown,
    roofMarks: shown === null ? [] : roofMarksOf(shown),
    draft:
      roofStep.kind === 'drawing' && document !== null ? draftViewOf(roofStep, document) : null,
    bar: document === null ? null : roofBarOf(roofStep, document, picture.kind === 'none', units),
    stepOff: {
      less: sizing === null || stepRefused(sizing, -1, units),
      more: sizing === null || stepRefused(sizing, 1, units),
    },
    lengthBox:
      sizing === null
        ? null
        : {
            traced: edgeLengths(sizing.base.roofs[sizing.roof]?.corners ?? [])[sizing.edge] ?? 0,
            typed: entryMetres(sizing.entry, units),
            first: lengthIsFirst(sizing.base),
          },
    pickedAngle: shown === null ? null : pickedAngleOf(roofStep, shown),
    dragTagAt: dragTagAt(roofStep),
    handlesOf: (roof, gap) => {
      const corners = shown?.roofs[roof]?.corners;
      return corners === undefined ? null : roofHandles(corners, gap);
    },
  };

  const close = () =>
    act({
      kind: 'close',
      id: aKey(),
      tracedOn: picture.kind === 'sky' ? 'sky' : 'none',
      stamp: picture.kind === 'sky' ? { source: picture.source, takenOn: picture.takenOn } : null,
    });

  const moves: RoofMoves = {
    draw: () => act({ kind: 'draw', helpers: helpersOf(helpersOff, free) }),
    // A second tap before the redraw flips from the list last asked for, never from a stale one.
    toggleHelper: (helper) => {
      const known = (askedOff.current ?? helpersOff).filter(isStudioHelper);
      const off = known.includes(helper)
        ? known.filter((other) => other !== helper)
        : [...known, helper];
      askedOff.current = off;
      setHelpersOff(off);
      act({ kind: 'helpers', helpers: helpersOf(off, free) });
    },
    retryHelpers: () => setHelpersOff(helpersOff.filter(isStudioHelper)),
    drawFree: (next) => {
      if (next === free) return;
      setFree(next);
      act({ kind: 'helpers', helpers: helpersOf(helpersOff, next) });
    },
    hover: (at) => act({ kind: 'hover', at }),
    // A tap on the first corner closes the shape, whether it lands on the dot or beside it.
    tap: (at) => {
      const now = step.current;
      if (now.kind === 'drawing' && draftClosesAt(now.corners, at)) close();
      else act({ kind: 'tap', at, system: units });
    },
    close,
    cancel: () => act({ kind: 'cancel' }),
    pickLength: (roof, edge) => act({ kind: 'pick_length', roof, edge, system: units }),
    typeLength: (entry) => act({ kind: 'type', entry }),
    stepLength: (by) => act({ kind: 'step', by, system: units }),
    setLength: () => act({ kind: 'set', system: units }),
    confirmLength: (use) => act({ kind: 'confirm', use, system: units }),
    grab: (grip, at) => act({ kind: 'grab', grip, at, system: units }),
    drag: (at) => act({ kind: 'drag', at }),
    release: () => act({ kind: 'release' }),
    pickCorner: (corner) => act({ kind: 'pick_corner', corner }),
    removeCorner: () => act({ kind: 'remove_corner' }),
    lengthUnits: (system) => {
      const now = step.current;
      if (now.kind !== 'sizing' || system === units) return;
      const traced = edgeLengths(now.base.roofs[now.roof]?.corners ?? [])[now.edge] ?? 0;
      const metres = entryMetres(now.entry, units) ?? traced;
      setUnits(system);
      act({ kind: 'type', entry: entryOf(metres, system, now.entry.measured) });
    },
  };
  return { view, moves, step, act };
}
