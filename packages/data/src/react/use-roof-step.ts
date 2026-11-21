'use client';
import {
  type CornerRef,
  type DraftView,
  draftViewOf,
  dragTagAt,
  edgeLengths,
  entryMetres,
  entryOf,
  type GroundPoint,
  type History,
  historyAfter,
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
  stepRefused,
} from '@heliogrid/domain';
import { type RefObject, useRef, useState } from 'react';
import { aKey } from '../client/creation-key';
import type { StudioPicture } from './studio-document-state';

/** The roof step's moves (`T-M05-002`, part b): drawing, the length box, and the fixes on a roof. */
export interface RoofMoves {
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
}: {
  /** The design as it stands, as the screen last drew it. */
  document: StudioDocument | null;
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  editable: boolean;
  units: MeasurementSystem;
  picture: StudioPicture;
  setUnits: (system: MeasurementSystem) => void;
}) {
  const [roofStep, setRoofStep] = useState<RoofStepState>(ROOF_STEP_START);
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

  const shown = document === null ? null : roofStepShown(roofStep, document, units);
  const sizing = roofStep.kind === 'sizing' ? roofStep : null;
  const view: RoofStepView = {
    roofStep,
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

  const moves: RoofMoves = {
    hover: (at) => act({ kind: 'hover', at }),
    tap: (at) => act({ kind: 'tap', at, system: units }),
    close: () =>
      act({
        kind: 'close',
        id: aKey(),
        tracedOn: picture.kind === 'sky' ? 'sky' : 'none',
        stamp: picture.kind === 'sky' ? { source: picture.source, takenOn: picture.takenOn } : null,
      }),
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
