'use client';
import {
  cornerNearest,
  draftClosesAt,
  draftViewOf,
  dragBeforeOf,
  dragTagAt,
  entryOf,
  focusJobOf,
  guidesOf,
  type History,
  handlesRoofOf,
  handMetres,
  heldCircleOf,
  heldCornerOf,
  historyAfter,
  KEY_MOVE_M,
  KEY_TURN_DEGREES,
  kindLineOf,
  type LengthEntry,
  labelLayoutOf,
  lengthSizesPicture,
  lengthSizesPlan,
  lengthSlide,
  type MeasurementSystem,
  magnetOf,
  type NumberEntry,
  pickedAngleOf,
  ROOF_STEP_START,
  type RoofFacts,
  type RoofStepEvent,
  type RoofStepState,
  roofBarOf,
  roofHandles,
  roofHeightOf,
  roofMarksOf,
  roofMiddle,
  roofStartHeightM,
  roofStepAfter,
  roofStepShown,
  roofsOnPlan,
  STUDIO_HELPERS,
  type StudioDocument,
  type StudioHelper,
  screenProjector,
  stepRefused,
  tagPlaceOf,
  tracedLength,
} from '@heliogrid/domain';
import { parapetInsidesOf } from '@heliogrid/domain/studio-kernel';
import { type RefObject, useMemo, useRef, useState } from 'react';
import { aKey } from '../client/creation-key';
import type { ClosingWith, RoofMoves, RoofStepView } from './roof-step-view';
import { sizeCardIn, useUnitsFollow } from './size-card';
import { type StudioPicture, stampOf, tracedOnOf } from './studio-document-state';

export type { RoofMoves, RoofStepView, SizeCardView } from './roof-step-view';

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
  helpersOff,
  setHelpersOff,
  helpersRefused,
  startHeightM,
  facts,
  typedStart,
  numberEntry,
  setNumberEntry,
  planOutlines,
  closingOf,
}: {
  /** The design as it stands, as the screen last drew it. */
  document: StudioDocument | null;
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  editable: boolean;
  units: MeasurementSystem;
  picture: StudioPicture;
  /**
   * The helpers the person turned off, as their account holds them: any one off is the magnet off
   * (`magnetOf`), and turning it off writes them all.
   */
  helpersOff: readonly string[];
  setHelpersOff: (off: readonly StudioHelper[]) => void;
  helpersRefused: boolean;
  /** The height a roof on the ground starts at: the market's plinth and one storey. */
  startHeightM: number;
  /** The market's roof facts: the height a roof of each kind starts at. */
  facts: RoofFacts;
  /** The market's start size for a typed roof. */
  typedStart: { readonly length: number; readonly width: number };
  numberEntry: NumberEntry;
  setNumberEntry: (entry: NumberEntry) => void;
  /** The laid plan's closed outlines, in its own units: a roof made from one is sized with it. */
  planOutlines: readonly (readonly number[])[];
  /** What a close carries, asked of the kernel: a roof's place, or a face closed onto roof `faces`. */
  closingOf: (document: StudioDocument, faces: number | undefined) => ClosingWith;
}) {
  const [roofStep, setRoofStep] = useState<RoofStepState>(ROOF_STEP_START);
  const [free, setFree] = useState(false);
  /** The magnet last asked for, so a second tap before the redraw flips from it. */
  const askedOn = useRef<boolean | null>(null);
  // The account answered — kept or refused: the pick it holds is the one to flip from again.
  // Compared by what it holds: an account with none is a new empty list on each render.
  const held = helpersOff.join(',');
  const answered = useRef(held);
  if (answered.current !== held) {
    answered.current = held;
    askedOn.current = null;
  }
  const step = useRef(roofStep);
  step.current = roofStep;

  useUnitsFollow(units, step, (event) => act(event));

  /** One event of the roof step: its state moves, and an act that ends commits one change. */
  const act = (event: RoofStepEvent) => {
    const at = latest.current;
    if (!editable || at === null) return;
    const outcome = roofStepAfter(step.current, event, at.present);
    step.current = outcome.state;
    setRoofStep(outcome.state);
    if (outcome.commit !== null) change(historyAfter(at, outcome.commit));
  };

  const picked = magnetOf(helpersOff, false);
  // The pick last asked for wins until the account answers: the switch already shows it.
  const magnet = (next: boolean = askedOn.current ?? picked) => next && !free;
  // The same design drawn is the same object from one render to the next: what is built from it
  // — the 3D model, the marks — is built once.
  const shown = useMemo(
    () => (document === null ? null : roofStepShown(roofStep, document, units)),
    [roofStep, document, units],
  );
  const sizing = roofStep.kind === 'sizing' ? roofStep : null;
  const view: RoofStepView = {
    roofStep,
    heights:
      shown?.roofs.map((roof) => roofHeightOf(roof, roofStartHeightM(shown, roof, facts))) ?? [],
    startHeightM,
    job: focusJobOf(roofStep),
    magnet: picked,
    magnetRefused: helpersRefused,
    shown,
    roofMarks: shown === null ? [] : roofMarksOf(shown),
    draft:
      roofStep.kind === 'drawing' && document !== null ? draftViewOf(roofStep, document) : null,
    bar: document === null ? null : roofBarOf(roofStep, document, picture.kind === 'none', units),
    kindLine: kindLineOf(roofStep, document),
    stepOff: {
      less: sizing === null || stepRefused(sizing, -1, units),
      more: sizing === null || stepRefused(sizing, 1, units),
    },
    sizeCard: sizeCardIn(roofStep, document, units, numberEntry),
    lengthBox:
      sizing === null
        ? null
        : {
            traced: tracedLength(sizing.base, sizing.roof, sizing.edge),
            typed: handMetres(sizing, units),
            first: lengthSizesPicture(sizing.base, sizing.roof) || lengthSizesPlan(sizing),
            slide: lengthSlide(tracedLength(sizing.base, sizing.roof, sizing.edge), units),
          },
    numberEntry,
    layoutLabels: labelLayoutOf,
    placeTag: tagPlaceOf,
    screenProjector,
    pickedAngle: shown === null ? null : pickedAngleOf(roofStep, shown),
    guides: guidesOf(roofStep),
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

  // Close shape takes the ghost corner; a tap on the first corner closes the shape as drawn.
  const closeWith = (ghost: boolean) => {
    const design = latest.current?.present;
    if (design === undefined) return;
    act({
      kind: 'close',
      id: aKey(),
      tracedOn: tracedOnOf(picture),
      stamp: stampOf(picture),
      ghost,
      ...closingOf(design, step.current.kind === 'drawing' ? step.current.faces : undefined),
    });
  };
  const close = () => closeWith(true);

  const grid = picture.kind === 'none';
  const stamp = stampOf(picture);
  const sizeEntry = (which: 'length' | 'width', entry: LengthEntry) =>
    act(
      which === 'length'
        ? { kind: 'type_entry', length: entry }
        : { kind: 'type_entry', width: entry },
    );

  const moves: RoofMoves = {
    // On the bare grid each corner lands on a whole metre.
    // While the sky picture is on its way, a roof would be stored as traced on none: it waits.
    draw: () => {
      if (picture.kind !== 'waiting') act({ kind: 'draw', magnet: magnet(), grid });
    },
    // A second tap before the redraw flips from the pick last asked for, never from a stale one.
    toggleMagnet: () => {
      const on = !(askedOn.current ?? picked);
      askedOn.current = on;
      setHelpersOff(on ? [] : STUDIO_HELPERS);
      act({ kind: 'magnet', magnet: on && !free });
    },
    retryMagnet: () => setHelpersOff(picked ? [] : STUDIO_HELPERS),
    drawFree: (next) => {
      if (next === free) return;
      setFree(next);
      act({ kind: 'magnet', magnet: !next && (askedOn.current ?? picked) });
    },
    wipe: () => act({ kind: 'wipe' }),
    deleteRoof: () => act({ kind: 'delete_roof' }),
    hover: (at) => act({ kind: 'hover', at }),
    // A tap on the first corner closes the shape, whether it lands on the dot or beside it.
    tap: (at) => {
      const now = step.current;
      if (now.kind === 'drawing' && draftClosesAt(now.corners, at)) closeWith(false);
      else act({ kind: 'tap', at, system: units });
    },
    close,
    closeAsDrawn: () => closeWith(false),
    cancel: () => act({ kind: 'cancel' }),
    pickLength: (roof, edge) => {
      const planRoofs = document === null ? [] : roofsOnPlan(document, planOutlines);
      act({ kind: 'pick_length', roof, edge, system: units, planRoofs });
    },
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
    grab: (grip, at) => {
      const design = latest.current?.present;
      // A roof moved onto another pulls to the inside of its parapet, which the kernel knows.
      const insides =
        grip.kind === 'move' && design !== undefined ? parapetInsidesOf(design, facts) : undefined;
      act({
        kind: 'grab',
        grip,
        at,
        system: units,
        magnet: magnet(),
        ...(insides === undefined ? {} : { insides }),
      });
    },
    drag: (at) => act({ kind: 'drag', at }),
    release: () => act({ kind: 'release' }),
    pickCorner: (corner) => act({ kind: 'pick_corner', corner }),
    nudgeRoof: (roof, kind, x, y) => {
      const corners = latest.current?.present.roofs[roof]?.corners;
      if (corners === undefined || (kind === 'turn' && x === 0)) return;
      const middle = roofMiddle(corners);
      const { east, north } = middle;
      if (kind === 'move') {
        act({ kind: 'grab', grip: { kind, roof }, at: middle, system: units, magnet: false });
        act({ kind: 'drag', at: { east: east + x * KEY_MOVE_M, north: north + y * KEY_MOVE_M } });
      } else {
        // Right turns clockwise, left anticlockwise, one degree a press.
        const turn = (-x * KEY_TURN_DEGREES * Math.PI) / 180;
        const at = { east: east + 1, north };
        act({ kind: 'grab', grip: { kind, roof }, at, system: units, magnet: false });
        act({ kind: 'drag', at: { east: east + Math.cos(turn), north: north + Math.sin(turn) } });
      }
      act({ kind: 'release' });
    },
    removeCorner: () => act({ kind: 'remove_corner' }),
    typeSize: () => {
      if (picture.kind !== 'waiting') act({ kind: 'type_size', start: typedStart, system: units });
    },
    typeSizeEntry: sizeEntry,
    slideSize: (which, metres) => sizeEntry(which, entryOf(metres, units, false)),
    typeSizePair: (text) => act({ kind: 'type_pair', text }),
    placeRoof: () => act({ kind: 'place', id: aKey(), stamp, system: units }),
  };
  const startFaces = (roof: number) => act({ kind: 'draw_faces', roof, magnet: magnet() });
  // The magnet as it works now (resting while Alt is held); startFaces: draw roof `roof`'s faces.
  return { view, moves, step, act, magnetNow: () => magnet(), startFaces };
}
