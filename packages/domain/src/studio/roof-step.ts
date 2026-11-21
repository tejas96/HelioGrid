import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofUnder } from './roof-check';
import { draftClose, draftSpot, draftTap, snapTargetsOf } from './roof-draw';
import { cornerAdded, cornerDragged, cornerRemoved, roofMoved, roofTurned } from './roof-edit';
import { roofMiddle } from './roof-shape';
import {
  committedLength,
  lengthKept,
  lengthPicked,
  lengthStepped,
  thenKept,
} from './roof-step-length';
import {
  idle,
  type RoofGrip,
  type RoofSaid,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';

/**
 * The roof step's reducer (`T-M05-002`, part b): drawing a roof, sizing an edge, dragging a corner or
 * a handle — or none of these. Each act that changes the design ends in ONE committed document, one
 * Undo; what is in hand shows as a preview and is never saved. `packages/data` holds the history,
 * the save queue and the clock; this reducer holds every decision (`CLAUDE.md` Law 11).
 */

type Dragging = Extract<RoofStepState, { kind: 'dragging' }>;

/** The roof a state holds, kept picked when it ends: the one dragged, sized or picked. */
function roofHeld(state: RoofStepState): number | null {
  if (state.kind === 'dragging') return state.grip.roof;
  if (state.kind === 'sizing' || state.kind === 'idle') return state.roof;
  return null;
}

/** The corner a grip moves: a dragged corner, or the one the + added; `null` for a whole roof. */
export function gripCorner(grip: RoofGrip): number | null {
  if (grip.kind === 'corner') return grip.corner;
  return grip.kind === 'plus' ? grip.edge + 1 : null;
}

function grabbed(document: StudioDocument, grip: RoofGrip, at: GroundPoint): RoofStepState | null {
  if (document.roofs[grip.roof] === undefined) return null;
  let base = document;
  if (grip.kind === 'plus') {
    const added = cornerAdded(document, grip.roof, grip.edge);
    if (added.kind !== 'done') return null;
    base = added.document;
  }
  const drag = { document: base, snap: null, fault: null };
  return { kind: 'dragging', grip, base, from: at, drag, degrees: 0 };
}

/** The turn from where the handle was taken to where it is now, about the roof's middle. */
function turnOf(state: Dragging, at: GroundPoint): number {
  const middle = roofMiddle(state.base.roofs[state.grip.roof]?.corners ?? []);
  const from = Math.atan2(state.from.north - middle.north, state.from.east - middle.east);
  const now = Math.atan2(at.north - middle.north, at.east - middle.east);
  const degrees = ((now - from) * 180) / Math.PI;
  if (degrees > 180) return degrees - 360;
  return degrees < -180 ? degrees + 360 : degrees;
}

function dragged(state: Dragging, at: GroundPoint): RoofStepState {
  const { grip, base, from } = state;
  const corner = gripCorner(grip);
  if (corner !== null) return { ...state, drag: cornerDragged(base, grip.roof, corner, at) };
  if (grip.kind === 'move') {
    const by = { east: at.east - from.east, north: at.north - from.north };
    return { ...state, drag: roofMoved(base, grip.roof, by) };
  }
  const turn = roofTurned(base, grip.roof, turnOf(state, at));
  return { ...state, drag: turn, degrees: turn.degrees };
}

const SAID_AFTER: Record<RoofGrip['kind'], (state: Dragging) => RoofSaid> = {
  plus: () => ({ kind: 'corner_added' }),
  corner: (state) => ({ kind: 'corner_moved', snap: state.drag.snap }),
  move: () => ({ kind: 'roof_moved' }),
  turn: (state) => ({ kind: 'roof_turned', degrees: Math.round(state.degrees) }),
};

function released(state: Dragging): RoofStepOutcome {
  const { drag, grip, base } = state;
  if (drag.fault === 'two_held')
    return stay(idle({ kind: 'refused', refusal: 'two_held' }, grip.roof));
  if (drag.fault !== null) {
    // A + let go with a fault keeps the corner it added, where it was added.
    return {
      state: idle({ kind: 'went_back', fault: drag.fault }, grip.roof),
      commit: grip.kind === 'plus' ? base : null,
    };
  }
  // A handle pressed and let go where it was changes nothing: no Undo step, no save.
  if (grip.kind !== 'plus' && drag.document === base) return stay(idle(null, grip.roof));
  return { state: idle(SAID_AFTER[grip.kind](state), grip.roof), commit: drag.document };
}

function tapped(state: RoofStepState, at: GroundPoint, document: StudioDocument): RoofStepOutcome {
  if (state.kind === 'idle' && state.picked !== null) return stay(idle(null, state.roof));
  // A tap inside a roof picks it; on open ground, none.
  if (state.kind === 'idle') return stay(idle(null, roofUnder(document.roofs, at)));
  if (state.kind !== 'drawing') return stay(state);
  const targets = snapTargetsOf(document.roofs);
  const tap = draftTap(state.corners, at, targets, document.roofs, state.helpers);
  if (tap.kind === 'same') return stay(state);
  if (tap.kind === 'refused') return stay({ ...state, refused: tap.refusal });
  return stay({ ...state, corners: tap.corners, pointer: null, spot: null, refused: null });
}

function closed(
  state: RoofStepState,
  event: Extract<RoofStepEvent, { kind: 'close' }>,
  document: StudioDocument,
): RoofStepOutcome {
  if (state.kind !== 'drawing') return stay(state);
  const close = draftClose(state.corners, document.roofs, event.id, event.tracedOn);
  if (close.kind === 'refused') return stay({ ...state, refused: close.refusal });
  // The first roof keeps the picture it was drawn on (M04-10).
  const first = document.roofs.length === 0 && document.drawnOn === null;
  return {
    state: idle({ kind: 'closed' }, document.roofs.length),
    commit: {
      ...document,
      roofs: [...document.roofs, close.roof],
      drawnOn: first ? event.stamp : document.drawnOn,
    },
  };
}

function cornerGone(state: RoofStepState, document: StudioDocument): RoofStepOutcome {
  if (state.kind !== 'idle' || state.picked === null) return stay(state);
  const removed = cornerRemoved(document, state.picked.roof, state.picked.corner);
  if (removed.kind === 'refused') {
    return stay(idle({ kind: 'refused', refusal: removed.refusal }, state.roof, state.picked));
  }
  return { state: idle({ kind: 'corner_removed' }, state.roof), commit: removed.document };
}

/** One handler per event, in the state it fits; in any other state the event is nothing. */
type Handlers = {
  readonly [K in RoofStepEvent['kind']]: (
    state: RoofStepState,
    event: Extract<RoofStepEvent, { kind: K }>,
    document: StudioDocument,
  ) => RoofStepOutcome;
};

function inState<K extends RoofStepState['kind']>(
  state: RoofStepState,
  kind: K,
  then: (state: Extract<RoofStepState, { kind: K }>) => RoofStepOutcome,
): RoofStepOutcome {
  return state.kind === kind ? then(state as Extract<RoofStepState, { kind: K }>) : stay(state);
}

const ON: Handlers = {
  draw: (state, { helpers }) =>
    state.kind === 'drawing'
      ? stay(state)
      : stay({
          kind: 'drawing',
          corners: [],
          pointer: null,
          spot: null,
          refused: null,
          helpers,
        }),
  // The spot under a still pointer snaps again by the helpers now in force: what shows is where a
  // tap would place the corner.
  helpers: (state, { helpers }, document) =>
    inState(state, 'drawing', (drawing) => {
      const { pointer, corners } = drawing;
      const targets = snapTargetsOf(document.roofs);
      const spot = pointer === null ? null : draftSpot(corners, pointer, targets, helpers);
      return stay({ ...drawing, helpers, spot });
    }),
  cancel: (state) => stay(idle(null, roofHeld(state))),
  hover: (state, { at }, document) =>
    inState(state, 'drawing', (drawing) => {
      const targets = snapTargetsOf(document.roofs);
      // The pointer moved on: a refusal of the last tap is behind it; the spot says its own.
      return stay({
        ...drawing,
        pointer: at,
        spot: at === null ? null : draftSpot(drawing.corners, at, targets, drawing.helpers),
        refused: null,
      });
    }),
  tap: (state, { at, system }, document) =>
    state.kind === 'sizing'
      ? thenKept(state, system, document, (kept) => stay(kept))
      : tapped(state, at, document),
  undo_corner: (state) =>
    inState(state, 'drawing', (drawing) =>
      stay({ ...drawing, corners: drawing.corners.slice(0, -1), refused: null }),
    ),
  close: closed,
  pick_length: (state, event, document) =>
    thenKept(state, event.system, document, (kept, at) => lengthPicked(kept, event, at)),
  type: (state, { entry }) =>
    inState(state, 'sizing', (sizing) => stay({ ...sizing, entry, asking: false })),
  step: (state, { by, system }) =>
    inState(state, 'sizing', (sizing) => lengthStepped(sizing, by, system)),
  set: (state, { system }) => inState(state, 'sizing', (sizing) => lengthKept(sizing, system)),
  confirm: (state, { use, system }) =>
    inState(state, 'sizing', (sizing) =>
      use ? committedLength(sizing, system) : stay({ ...sizing, asking: false }),
    ),
  grab: (state, { grip, at, system }, document) =>
    state.kind === 'drawing'
      ? stay(state)
      : thenKept(state, system, document, (kept, now) => stay(grabbed(now, grip, at) ?? kept)),
  drag: (state, { at }) => inState(state, 'dragging', (held) => stay(dragged(held, at))),
  release: (state) => inState(state, 'dragging', released),
  pick_corner: (state, { corner }) =>
    inState(state, 'idle', (looking) =>
      stay(
        corner === null
          ? idle(null, looking.roof)
          : idle({ kind: 'corner_picked' }, corner.roof, corner),
      ),
    ),
  remove_corner: (state, _event, document) => cornerGone(state, document),
};

/**
 * The roof step after one event, with the design it acts on. Total: an event that does not fit the
 * state changes nothing.
 */
export function roofStepAfter(
  state: RoofStepState,
  event: RoofStepEvent,
  document: StudioDocument,
): RoofStepOutcome {
  const handle = ON[event.kind] as (
    state: RoofStepState,
    event: RoofStepEvent,
    document: StudioDocument,
  ) => RoofStepOutcome;
  return handle(state, event, document);
}
