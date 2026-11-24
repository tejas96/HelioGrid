import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { draftClose } from './roof-draw';
import { belongsTo, roofKindOf } from './roof-kind';
import type { HoleFitter } from './roof-meeting';
import { roofNameOf } from './roof-names';
import { becameFacts, placedAt, roofMadeInto } from './roof-place';
import { reshaped } from './roof-reshape';
import { withoutRoof } from './roof-step-draw';
import {
  idle,
  type RoofApart,
  type RoofBecame,
  type RoofSaid,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';

/**
 * The roof step's moves among many roofs (`T-M05-002`, part e): a closed roof takes its place, a
 * chip makes it another kind, Join makes two roofs one and a kind's chip parts them again, and Cut
 * to edge trims it to its neighbour. Each is one change, with Undo.
 */

type Event<K extends RoofStepEvent['kind']> = Extract<RoofStepEvent, { kind: K }>;

/**
 * What the line said a roof became, while it still says it of that roof. The design can change
 * under the line — a height kept in 3D, a save read again — so the roof at its place is checked
 * by its own name: `stale` when another roof stands there now.
 */
function becameOf(
  state: RoofStepState,
  roof: number,
  document: StudioDocument,
): RoofBecame | 'stale' | null {
  if (state.kind !== 'idle') return null;
  const said = state.said;
  const became = said?.kind === 'closed' || said?.kind === 'cut' ? said.became : undefined;
  if (became === undefined || became.roof !== roof) return null;
  return document.roofs[roof]?.id === became.id ? became : 'stale';
}

/**
 * A roof that is now a hole, fitted to the roof it is cut in (E015): clear inside it stays; along
 * that roof's edge it is a notch in its outline instead, and goes; at a corner alone it moves
 * clear. `notched`: the roof that took the notch, where it did.
 *
 * Only a hole a person picked becomes a notch: one the studio guessed on a close keeps its chips,
 * so a wrong guess stays one tap. Nor does a roof whose faces were drawn by hand take a notch: its
 * faces would no longer cover it.
 */
function holeFitted(
  document: StudioDocument,
  index: number,
  fitHole: HoleFitter,
  picked: boolean,
): { readonly document: StudioDocument; readonly notched: number | null } {
  const hole = document.roofs[index];
  const owner = hole === undefined ? null : belongsTo(document, hole);
  const roof = owner === null ? undefined : document.roofs[owner];
  if (hole === undefined || roof === undefined || roofKindOf(hole) !== 'hole') {
    return { document, notched: null };
  }
  const fit = fitHole(roof.corners, hole.corners);
  const faced = (roof.shape?.faces?.length ?? 0) > 0;
  if (fit.kind === 'inside' || (fit.kind === 'notch' && (!picked || faced))) {
    return { document, notched: null };
  }
  if (fit.kind === 'moved') {
    const moved = { ...hole, corners: fit.corners };
    return {
      document: { ...document, roofs: document.roofs.map((r, i) => (i === index ? moved : r)) },
      notched: null,
    };
  }
  const cut = reshaped(roof, fit.outline, [roof, hole]);
  const withCut = { ...document, roofs: document.roofs.map((r) => (r === roof ? cut : r)) };
  const commit = withoutRoof(withCut, index);
  return { document: commit, notched: commit.roofs.findIndex((r) => r.id === roof.id) };
}

/**
 * An act that made a roof a hole, its hole fitted: a notch says so, and the line leaves. `picked`:
 * a person picked the kind; else the studio guessed it.
 */
function asFitted(
  outcome: RoofStepOutcome,
  index: number,
  fitHole: HoleFitter,
  picked: boolean,
): RoofStepOutcome {
  if (outcome.commit === null) return outcome;
  const fitted = holeFitted(outcome.commit, index, fitHole, picked);
  if (fitted.notched === null) return { ...outcome, commit: fitted.document };
  const roof = fitted.notched;
  const name = roofNameOf(fitted.document, roof) ?? { kind: 'roof', number: roof + 1 };
  return { state: idle({ kind: 'notched', roof, name }, roof), commit: fitted.document };
}

/** The line leaves and nothing changes: what it spoke of is no longer what stands there. */
const lineGone = (state: RoofStepState): RoofStepOutcome =>
  stay(state.kind === 'idle' ? idle(null, state.roof) : state);

/** Two roofs made one: the roof it met takes the joined outline, and the new roof is gone into it. */
function joinedAs(
  document: StudioDocument,
  roof: number,
  met: number,
  outline: readonly GroundPoint[],
  became: RoofBecame | null,
): RoofStepOutcome {
  const fresh = document.roofs[roof] as Roof;
  const target = document.roofs[met] as Roof;
  const one = reshaped(target, outline, [target, fresh]);
  const withOne = { ...document, roofs: document.roofs.map((r, i) => (i === met ? one : r)) };
  const joined = met > roof ? met - 1 : met;
  const commit = withoutRoof(withOne, roof);
  const name = roofNameOf(commit, joined) ?? { kind: 'roof', number: joined + 1 };
  const apart: RoofApart | undefined =
    became === null ? undefined : { fresh, met: target, became, joined: one };
  const said: RoofSaid = { kind: 'joined', roof: joined, name, ...(apart ? { apart } : {}) };
  return { state: idle(said, joined), commit };
}

/**
 * A closed roof stands at once, placed by how it meets the roofs already standing: only this roof
 * is placed. Where two sloped roofs of one material would cut through each other, it joins the
 * roof it meets by itself, and its chips can part them.
 */
export function closed(
  state: RoofStepState,
  event: Event<'close'>,
  document: StudioDocument,
): RoofStepOutcome {
  if (state.kind !== 'drawing') return stay(state);
  const close = draftClose(state.corners, document.roofs, event.id, event.tracedOn, event.ghost);
  if (close.kind === 'refused') return stay({ ...state, refused: close.refusal });
  // The first roof keeps the picture it was drawn on (M04-10).
  const first = document.roofs.length === 0 && document.drawnOn === null;
  const index = document.roofs.length;
  const stamped = { ...document, drawnOn: first ? event.stamp : document.drawnOn };
  if (event.placing === undefined) {
    const commit = { ...stamped, roofs: [...document.roofs, close.roof] };
    return { state: idle({ kind: 'closed' }, index), commit };
  }
  const { meet, ...rest } = event.placing;
  const meeting = meet(close.roof.corners);
  const placed = placedAt(document, close.roof, index, { ...rest, meeting });
  const commit = { ...stamped, roofs: [...document.roofs, placed.roof] };
  if (meeting.joinFirst && meeting.joined !== null && meeting.joinWith !== null) {
    return joinedAs(commit, index, meeting.joinWith, meeting.joined, placed.became);
  }
  const outcome = { state: idle({ kind: 'closed', became: placed.became }, index), commit };
  return asFitted(outcome, index, rest.fitHole, false);
}

/** A kind's chip on a joined roof: the two stand apart again, and the new one is that kind. */
function parted(
  joined: Extract<RoofSaid, { kind: 'joined' }> & { readonly apart: RoofApart },
  event: Event<'make'>,
  document: StudioDocument,
): RoofStepOutcome {
  const { fresh, met, became } = joined.apart;
  const roofs = document.roofs.map((roof, i) => (i === joined.roof ? met : roof));
  const index = roofs.length;
  const apart = { ...document, roofs: [...roofs, fresh] };
  const made = roofMadeInto(apart, index, event.into, event.facts);
  const now = becameFacts(made, index, event.facts, joined.roof);
  const said: RoofSaid = {
    kind: 'closed',
    became: { ...became, ...now, roof: index, joinWith: joined.roof },
  };
  return asFitted({ state: idle(said, index), commit: made }, index, event.fitHole, true);
}

/** A kind picked: on the line after a close its chip lights and the line stays; from a sheet it is said. */
export function kindMade(
  state: RoofStepState,
  event: Event<'make'>,
  document: StudioDocument,
): RoofStepOutcome {
  const line = state.kind === 'idle' ? state.said : null;
  if (line?.kind === 'joined' && line.apart !== undefined && line.roof === event.roof) {
    // Only the roof Join left is parted: one changed since keeps what it holds now.
    if (document.roofs[line.roof] !== line.apart.joined) return lineGone(state);
    return parted({ ...line, apart: line.apart }, event, document);
  }
  const became = becameOf(state, event.roof, document);
  if (became === 'stale') return lineGone(state);
  const made = roofMadeInto(document, event.roof, event.into, event.facts);
  if (made === document) return stay(state);
  const now = becameFacts(made, event.roof, event.facts);
  const said: RoofSaid =
    became === null
      ? { kind: 'made', roof: event.roof, is: now.is, name: now.name }
      : { kind: 'closed', became: { ...became, ...now, beside: now.beside ?? became.beside } };
  return asFitted({ state: idle(said, event.roof), commit: made }, event.roof, event.fitHole, true);
}

/** Join: the new roof and the roof it met become one, and the line's chips can still part them. */
export function joinedIn(
  state: RoofStepState,
  event: Event<'join'>,
  document: StudioDocument,
): RoofStepOutcome {
  const fresh = document.roofs[event.roof];
  const target = document.roofs[event.with];
  if (fresh === undefined || target === undefined || event.roof === event.with) return stay(state);
  const became = becameOf(state, event.roof, document);
  if (became === 'stale') return lineGone(state);
  return joinedAs(document, event.roof, event.with, event.outline, became);
}

/** Cut to edge: the new roof on the corners it was cut back to, placed again by how it now meets the others. */
export function cutBack(
  state: RoofStepState,
  event: Event<'cut_to_edge'>,
  document: StudioDocument,
): RoofStepOutcome {
  const roof = document.roofs[event.roof];
  if (roof === undefined) return stay(state);
  if (becameOf(state, event.roof, document) === 'stale') return lineGone(state);
  const cut = reshaped(roof, event.corners, [roof]);
  const placed = placedAt(document, cut, event.roof, event.placing);
  const roofs = document.roofs.map((each, i) => (i === event.roof ? placed.roof : each));
  const outcome = {
    state: idle({ kind: 'cut', became: placed.became }, event.roof),
    commit: { ...document, roofs },
  };
  return asFitted(outcome, event.roof, event.placing.fitHole, false);
}
