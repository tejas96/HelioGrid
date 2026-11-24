import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { cornerAdded, cornerDragged, cornerRemoved } from './roof-edit';
import { roofMoved, roofTurned } from './roof-move';
import { roofNameOf } from './roof-names';
import { roofMiddle } from './roof-shape';
import { type SnapTargets, snapTargetsOf } from './roof-snap';
import { copied, deleted } from './roof-step-copy';
import { cornerUndone, drawing, spotAt, stopped, tapped } from './roof-step-draw';
import {
  committedLength,
  lengthKept,
  lengthPicked,
  lengthStepped,
  thenKept,
} from './roof-step-length';
import { materialSet, sideWalled } from './roof-step-own';
import { closed, cutBack, joinedIn, kindMade } from './roof-step-place';
import {
  idle,
  type RoofGrip,
  type RoofSaid,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';
import {
  typingEntered,
  typingInUnits,
  typingOpened,
  typingPaired,
  typingPlaced,
} from './roof-step-type';
import { roofSetFree, stuckOutBy } from './roof-sticks-out';

/**
 * The roof step's reducer (`T-M05-002`, part b): drawing a roof, sizing an edge, dragging a corner or
 * a handle — or none of these. Each act that changes the design ends in ONE committed document, one
 * Undo; what is in hand shows as a preview and is never saved. `packages/data` holds the history,
 * the save queue and the clock; this reducer holds every decision (`CLAUDE.md` Law 11).
 */

type Dragging = Extract<RoofStepState, { kind: 'dragging' }>;

/** The corner a grip moves: a dragged corner, or the one the + added; `null` for a whole roof. */
export function gripCorner(grip: RoofGrip): number | null {
  if (grip.kind === 'corner') return grip.corner;
  return grip.kind === 'plus' ? grip.edge + 1 : null;
}

function grabbed(
  document: StudioDocument,
  grip: RoofGrip,
  at: GroundPoint,
  magnet: boolean,
  insides: SnapTargets['edges'] = [],
): RoofStepState | null {
  if (document.roofs[grip.roof] === undefined) return null;
  let base = document;
  if (grip.kind === 'plus') {
    const added = cornerAdded(document, grip.roof, grip.edge);
    if (added.kind !== 'done') return null;
    base = added.document;
  }
  const drag = { document: base, snap: null, fault: null, guides: [] };
  return { kind: 'dragging', grip, base, from: at, drag, degrees: 0, magnet, insides };
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
  const { grip, base, from, magnet, insides } = state;
  const corner = gripCorner(grip);
  if (corner !== null)
    return { ...state, drag: cornerDragged(base, grip.roof, corner, at, magnet) };
  if (grip.kind === 'move') {
    const by = { east: at.east - from.east, north: at.north - from.north };
    return { ...state, drag: roofMoved(base, grip.roof, by, magnet ? (insides ?? []) : null) };
  }
  const turn = roofTurned(base, grip.roof, turnOf(state, at), magnet);
  return { ...state, drag: turn, degrees: turn.degrees };
}

const SAID_AFTER: Record<RoofGrip['kind'], (state: Dragging) => RoofSaid> = {
  plus: () => ({ kind: 'corner_added' }),
  corner: (state) => ({ kind: 'corner_moved', snap: state.drag.snap }),
  move: () => ({ kind: 'roof_moved' }),
  turn: (state) => ({ kind: 'roof_turned', degrees: Math.round(state.degrees) }),
};

/** What a drag did to a roof's place: set it free of its roof, or left one past its roof's edge. */
function placeSaid(
  base: StudioDocument,
  commit: StudioDocument,
  dragged: StudioDocument,
  roof: number,
): RoofSaid | null {
  const nameOf = (index: number) =>
    roofNameOf(commit, index) ?? { kind: 'roof', number: index + 1 };
  if (commit !== dragged) return { kind: 'set_free', roof, name: nameOf(roof) };
  const out = stuckOutBy(base, commit);
  return out === null ? null : { kind: 'sticks_out', roof: out, name: nameOf(out) };
}

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
  // A roof dragged clear of the roof it stood on is its own roof; one left past its edge stays.
  const commit = roofSetFree(drag.document, grip.roof);
  const said = placeSaid(base, commit, drag.document, grip.roof) ?? SAID_AFTER[grip.kind](state);
  return { state: idle(said, grip.roof), commit };
}

function cornerGone(state: RoofStepState, document: StudioDocument): RoofStepOutcome {
  if (state.kind !== 'idle' || state.picked === null) return stay(state);
  const removed = cornerRemoved(document, state.picked.roof, state.picked.corner);
  if (removed.kind === 'refused') {
    return stay(idle({ kind: 'refused', refusal: removed.refusal }, state.roof, state.picked));
  }
  const at = document.roofs[state.picked.roof]?.corners[state.picked.corner];
  const gone: RoofSaid | null = at === undefined ? null : { kind: 'corner_removed', at };
  // A roof made smaller keeps its new shape: what now sticks out past it is said, to check.
  const said = placeSaid(document, removed.document, removed.document, state.picked.roof) ?? gone;
  return { state: idle(said, state.roof), commit: removed.document };
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
  draw: (state, { magnet, grid }) =>
    state.kind === 'drawing' ? stay(state) : stay(drawing(magnet, [], grid ?? false)),
  type_size: typingOpened,
  type_entry: (state, event) => inState(state, 'typing', (typing) => typingEntered(typing, event)),
  type_pair: (state, { text }) => inState(state, 'typing', (typing) => typingPaired(typing, text)),
  type_units: (state, { from, to }) =>
    inState(state, 'typing', (typing) => typingInUnits(typing, from, to)),
  place: (state, event, document) =>
    inState(state, 'typing', (typing) => typingPlaced(typing, event, document)),
  // The spot under a still pointer snaps again with the magnet as it is now: what shows is where a
  // tap would place the corner. A drag in hand pulls by it from its next move.
  magnet: (state, { magnet }, document) => {
    if (state.kind === 'dragging') return stay({ ...state, magnet });
    // A stopped drawing taken up again by Undo draws with the magnet as it is now.
    if (state.kind === 'idle' && state.left)
      return stay({ ...state, left: { ...state.left, magnet } });
    return inState(state, 'drawing', (held) => {
      const { pointer } = held;
      const targets = snapTargetsOf(document.roofs);
      return stay({ ...held, magnet, spot: spotAt({ ...held, magnet }, pointer, targets) });
    });
  },
  wipe: (state) =>
    inState(state, 'drawing', (held) =>
      held.corners.length < 2
        ? stay(held)
        : stay({ ...held, corners: [], wiped: held.corners, spot: null, refused: null }),
    ),
  delete_roof: deleted,
  make: kindMade,
  join: joinedIn,
  cut_to_edge: cutBack,
  copy_roof: copied,
  side_wall: sideWalled,
  material: materialSet,
  cancel: stopped,
  hover: (state, { at }, document) =>
    inState(state, 'drawing', (held) => {
      const targets = snapTargetsOf(document.roofs);
      // The pointer moved on: a refusal of the last tap is behind it; the spot says its own.
      return stay({ ...held, pointer: at, spot: spotAt(held, at, targets), refused: null });
    }),
  tap: (state, { at, system }, document) =>
    state.kind === 'sizing'
      ? thenKept(state, system, document, (kept) => stay(kept))
      : tapped(state, at, document),
  undo_corner: cornerUndone,
  close: closed,
  pick_length: (state, event, document) =>
    state.kind === 'typing'
      ? stay(state)
      : thenKept(state, event.system, document, (kept, at) => lengthPicked(kept, event, at)),
  type: (state, { entry }) =>
    inState(state, 'sizing', (sizing) => stay({ ...sizing, entry, asking: false })),
  step: (state, { by, system }) =>
    inState(state, 'sizing', (sizing) => lengthStepped(sizing, by, system)),
  set: (state, { system }) => inState(state, 'sizing', (sizing) => lengthKept(sizing, system)),
  confirm: (state, { use, system }) =>
    inState(state, 'sizing', (sizing) =>
      use ? committedLength(sizing, system) : stay({ ...sizing, asking: false }),
    ),
  grab: (state, { grip, at, system, magnet, insides }, document) =>
    state.kind === 'drawing' || state.kind === 'typing'
      ? stay(state)
      : thenKept(state, system, document, (kept, now) =>
          stay(grabbed(now, grip, at, magnet, insides) ?? kept),
        ),
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
  history: (state, { undone, change }) =>
    inState(state, 'idle', (looking) =>
      stay(idle({ kind: undone ? 'undone' : 'redone', change }, looking.roof)),
    ),
  pick_roof: (state, { roof, metres }, document) =>
    inState(state, 'idle', () => {
      const name = roofNameOf(document, roof) ?? undefined;
      return stay(idle({ kind: 'roof_picked', roof, metres, name }, roof));
    }),
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
