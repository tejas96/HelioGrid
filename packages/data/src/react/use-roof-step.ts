'use client';
import {
  cornerNearest,
  draftClosesAt,
  draftViewOf,
  dragBeforeOf,
  dragTagAt,
  entryOf,
  focusJobOf,
  type History,
  handlesRoofOf,
  handMetres,
  heldCircleOf,
  heldCornerOf,
  helpersOf,
  historyAfter,
  isStudioHelper,
  KEY_MOVE_M,
  KEY_TURN_DEGREES,
  labelLayoutOf,
  lengthIsFirst,
  lengthSlide,
  type MeasurementSystem,
  type NumberEntry,
  pickedAngleOf,
  ROOF_STEP_START,
  type RoofStepEvent,
  type RoofStepState,
  roofBarOf,
  roofHandles,
  roofHeightOf,
  roofMarksOf,
  roofMiddle,
  roofStepAfter,
  roofStepShown,
  type StudioDocument,
  type StudioHelper,
  stepRefused,
  tracedLength,
} from '@heliogrid/domain';
import { type RefObject, useRef, useState } from 'react';
import { aKey } from '../client/creation-key';
import type { RoofMoves, RoofStepView } from './roof-step-view';
import type { StudioPicture } from './studio-document-state';

export type { RoofMoves, RoofStepView } from './roof-step-view';

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
  storeyHeightM,
  numberEntry,
  setNumberEntry,
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
  /** The market's storey height: a roof with no height of its own stands at it. */
  storeyHeightM: number;
  numberEntry: NumberEntry;
  setNumberEntry: (entry: NumberEntry) => void;
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
    heights: shown?.roofs.map((roof) => roofHeightOf(roof, storeyHeightM)) ?? [],
    job: focusJobOf(roofStep),
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
            traced: tracedLength(sizing.base, sizing.roof, sizing.edge),
            typed: handMetres(sizing, units),
            first: lengthIsFirst(sizing.base),
            slide: lengthSlide(tracedLength(sizing.base, sizing.roof, sizing.edge), units),
          },
    numberEntry,
    layoutLabels: labelLayoutOf,
    pickedAngle: shown === null ? null : pickedAngleOf(roofStep, shown),
    dragTagAt: dragTagAt(roofStep),
    dragBefore: dragBeforeOf(roofStep),
    heldCircle: heldCircleOf(roofStep),
    heldCorner: heldCornerOf(roofStep),
    handlesRoof: document === null ? null : handlesRoofOf(roofStep, document),
    cornerNearest: (roof, at) => cornerNearest(shown?.roofs[roof]?.corners ?? [], at),
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
    slideLength: (metres) => {
      const now = step.current;
      if (now.kind === 'sizing')
        act({ kind: 'type', entry: entryOf(metres, units, now.entry.measured) });
    },
    chooseNumberEntry: (entry) => {
      if (entry !== numberEntry) setNumberEntry(entry);
    },
    stepLength: (by) => act({ kind: 'step', by, system: units }),
    setLength: () => act({ kind: 'set', system: units }),
    confirmLength: (use) => act({ kind: 'confirm', use, system: units }),
    grab: (grip, at) => act({ kind: 'grab', grip, at, system: units }),
    drag: (at) => act({ kind: 'drag', at }),
    release: () => act({ kind: 'release' }),
    pickCorner: (corner) => act({ kind: 'pick_corner', corner }),
    nudgeRoof: (roof, kind, x, y) => {
      const corners = latest.current?.present.roofs[roof]?.corners;
      if (corners === undefined || (kind === 'turn' && x === 0)) return;
      const middle = roofMiddle(corners);
      const { east, north } = middle;
      if (kind === 'move') {
        act({ kind: 'grab', grip: { kind, roof }, at: middle, system: units });
        act({ kind: 'drag', at: { east: east + x * KEY_MOVE_M, north: north + y * KEY_MOVE_M } });
      } else {
        // Right turns clockwise, left anticlockwise, one degree a press.
        const turn = (-x * KEY_TURN_DEGREES * Math.PI) / 180;
        act({ kind: 'grab', grip: { kind, roof }, at: { east: east + 1, north }, system: units });
        act({ kind: 'drag', at: { east: east + Math.cos(turn), north: north + Math.sin(turn) } });
      }
      act({ kind: 'release' });
    },
    removeCorner: () => act({ kind: 'remove_corner' }),
    lengthUnits: (system) => {
      const now = step.current;
      if (now.kind !== 'sizing' || system === units) return;
      const metres = handMetres(now, units) ?? tracedLength(now.base, now.roof, now.edge);
      setUnits(system);
      act({ kind: 'type', entry: entryOf(metres, system, now.entry.measured) });
    },
  };
  return { view, moves, step, act };
}
