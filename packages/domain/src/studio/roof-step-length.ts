import type { MeasurementSystem } from '../format/pack';
import type { StudioDocument } from './document';
import {
  entryOf,
  handMetres,
  handUntouched,
  sizingResult,
  steppedEntry,
  stepRefused,
  tracedLength,
} from './roof-entry';
import { lengthAsks, lengthSizesPicture } from './roof-length';
import {
  idle,
  type RoofSaid,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';

/**
 * The roof step's length in the box (`T-M05-002`, part b): opened on an edge, stepped, asked about
 * once when far off the picture, and kept as one change — or let go when left as it opened.
 */

type Sizing = Extract<RoofStepState, { kind: 'sizing' }>;

export function committedLength(state: Sizing, system: MeasurementSystem): RoofStepOutcome {
  const result = sizingResult(state, system);
  if (result.kind !== 'done') return stay(state);
  const metres = handMetres(state, system) ?? 0;
  const said: RoofSaid = lengthSizesPicture(state.base, state.roof)
    ? { kind: 'sized' }
    : { kind: 'set', metres, measured: state.entry.measured };
  return { state: idle(said, state.roof), commit: result.document };
}

export function lengthPicked(
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
export function lengthKept(state: Sizing, system: MeasurementSystem): RoofStepOutcome {
  const metres = handMetres(state, system);
  const traced = tracedLength(state.base, state.roof, state.edge);
  const asks = metres !== null && !state.asking && lengthAsks(traced, metres);
  if (asks && sizingResult(state, system).kind === 'done') return stay({ ...state, asking: true });
  return committedLength(state, system);
}

export function lengthStepped(
  state: Sizing,
  by: 1 | -1,
  system: MeasurementSystem,
): RoofStepOutcome {
  const entry = stepRefused(state, by, system) ? null : steppedEntry(state, by, system);
  return stay(entry === null ? state : { ...state, entry, asking: false });
}

/**
 * Set, Enter or a tap outside keeps the length in the box: before a tap, another length or a grab
 * goes on, a length the person changed is kept first — or the box stays open, asking or saying why
 * it cannot. One left as it opened is let go.
 */
export function thenKept(
  state: RoofStepState,
  system: MeasurementSystem,
  document: StudioDocument,
  next: (state: RoofStepState, document: StudioDocument) => RoofStepOutcome,
): RoofStepOutcome {
  if (state.kind !== 'sizing') return next(state, document);
  // Opened and left as it was: only Set says this is the edge's true length.
  if (handUntouched(state, system)) return next(idle(null, state.roof), document);
  const kept = lengthKept(state, system);
  if (kept.state.kind === 'sizing') return kept;
  const after = next(kept.state, kept.commit ?? document);
  return { state: after.state, commit: after.commit ?? kept.commit };
}
