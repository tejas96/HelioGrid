import type { MeasurementSystem } from '../format/pack';
import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { draftClose, draftSpot, draftTap, snapTargetsOf } from './roof-draw';
import { cornerAdded, cornerDragged, cornerRemoved, roofMoved, roofTurned } from './roof-edit';
import {
  entryMetres,
  entryOf,
  sizingResult,
  steppedEntry,
  stepRefused,
  tracedLength,
} from './roof-entry';
import { lengthAsks, lengthIsFirst } from './roof-length';
import { roofMiddle } from './roof-shape';
import type {
  CornerRef,
  RoofGrip,
  RoofSaid,
  RoofStepEvent,
  RoofStepOutcome,
  RoofStepState,
} from './roof-step-state';

/**
 * The roof step's reducer (`T-M05-002`, part b): drawing a roof, sizing an edge, dragging a corner or
 * a handle — or none of these. Each act that changes the design ends in ONE committed document, one
 * Undo; what is in hand shows as a preview and is never saved. `packages/data` holds the history,
 * the save queue and the clock; this reducer holds every decision (`CLAUDE.md` Law 11).
 */

type Sizing = Extract<RoofStepState, { kind: 'sizing' }>;
type Dragging = Extract<RoofStepState, { kind: 'dragging' }>;

function stay(state: RoofStepState): RoofStepOutcome {
  return { state, commit: null };
}

function idle(said: RoofSaid | null, picked: CornerRef | null = null): RoofStepState {
  return { kind: 'idle', picked, said };
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
  if (drag.fault === 'two_held') return stay(idle({ kind: 'refused', refusal: 'two_held' }));
  if (drag.fault !== null) {
    // A + let go with a fault keeps the corner it added, where it was added.
    return {
      state: idle({ kind: 'went_back', fault: drag.fault }),
      commit: grip.kind === 'plus' ? base : null,
    };
  }
  // A handle pressed and let go where it was changes nothing: no Undo step, no save.
  if (grip.kind !== 'plus' && drag.document === base) return stay(idle(null));
  return { state: idle(SAID_AFTER[grip.kind](state)), commit: drag.document };
}

function committedLength(state: Sizing, system: MeasurementSystem): RoofStepOutcome {
  const result = sizingResult(state, system);
  if (result.kind !== 'done') return stay(state);
  const metres = entryMetres(state.entry, system) ?? 0;
  const said: RoofSaid = lengthIsFirst(state.base)
    ? { kind: 'sized' }
    : { kind: 'set', metres, measured: state.entry.measured };
  return { state: idle(said), commit: result.document };
}

function lengthPicked(
  state: RoofStepState,
  event: Extract<RoofStepEvent, { kind: 'pick_length' }>,
  document: StudioDocument,
): RoofStepOutcome {
  const roof = document.roofs[event.roof];
  if (state.kind === 'drawing' || state.kind === 'dragging' || roof === undefined) {
    return stay(state);
  }
  const metres = tracedLength(document, event.roof, event.edge);
  return stay({
    kind: 'sizing',
    roof: event.roof,
    edge: event.edge,
    base: document,
    entry: entryOf(metres, event.system, roof.edges[event.edge] === 'measured'),
    asking: false,
  });
}

/** Set or Enter: a value far off the picture asks once; any other is kept. */
function lengthKept(state: Sizing, system: MeasurementSystem): RoofStepOutcome {
  const metres = entryMetres(state.entry, system);
  const traced = tracedLength(state.base, state.roof, state.edge);
  const asks = metres !== null && !state.asking && lengthAsks(traced, metres);
  if (asks && sizingResult(state, system).kind === 'done') return stay({ ...state, asking: true });
  return committedLength(state, system);
}

function lengthStepped(state: Sizing, by: 1 | -1, system: MeasurementSystem): RoofStepOutcome {
  const entry = stepRefused(state, by, system) ? null : steppedEntry(state, by, system);
  return stay(entry === null ? state : { ...state, entry, asking: false });
}

/**
 * Set, Enter or a tap outside keeps the length in the box: before a tap, another length or a grab
 * goes on, the length is kept first — or the box stays open, asking or saying why it cannot.
 */
function thenKept(
  state: RoofStepState,
  system: MeasurementSystem,
  document: StudioDocument,
  next: (state: RoofStepState, document: StudioDocument) => RoofStepOutcome,
): RoofStepOutcome {
  if (state.kind !== 'sizing') return next(state, document);
  const kept = lengthKept(state, system);
  if (kept.state.kind === 'sizing') return kept;
  const after = next(kept.state, kept.commit ?? document);
  return { state: after.state, commit: after.commit ?? kept.commit };
}

function tapped(state: RoofStepState, at: GroundPoint, document: StudioDocument): RoofStepOutcome {
  if (state.kind === 'idle' && state.picked !== null) return stay(idle(null));
  if (state.kind !== 'drawing') return stay(state);
  const tap = draftTap(state.corners, at, snapTargetsOf(document.roofs), document.roofs);
  if (tap.kind === 'same') return stay(state);
  if (tap.kind === 'refused') return stay({ ...state, refused: tap.refusal });
  return stay({ ...state, corners: tap.corners, spot: null, refused: null });
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
    state: idle({ kind: 'closed' }),
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
    return stay(idle({ kind: 'refused', refusal: removed.refusal }, state.picked));
  }
  return { state: idle({ kind: 'corner_removed' }), commit: removed.document };
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
  draw: () => stay({ kind: 'drawing', corners: [], spot: null, refused: null }),
  cancel: () => stay(idle(null)),
  hover: (state, { at }, document) =>
    inState(state, 'drawing', (drawing) => {
      const targets = snapTargetsOf(document.roofs);
      return stay({
        ...drawing,
        spot: at === null ? null : draftSpot(drawing.corners, at, targets),
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
    inState(state, 'idle', () =>
      stay(corner === null ? idle(null) : idle({ kind: 'corner_picked' }, corner)),
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
