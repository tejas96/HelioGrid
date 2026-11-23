import {
  cornerRoom,
  ROOFS_MAX,
  type Roof,
  type RoofEdgeTrust,
  type StudioDocument,
} from './document';
import type { GroundPoint } from './ground';
import { roofWithItsParts } from './roof-kind';
import { roofNameOf } from './roof-names';
import type { RoofSide } from './roof-parts';
import { becameFacts, placedAt, roofMadeInto } from './roof-place';
import { CORNER_GAP_M, roofsOverlap } from './roof-shape';
import { pickedRoofOf, withoutRoof } from './roof-step-draw';
import {
  idle,
  type RoofBecame,
  type RoofSaid,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';

/**
 * The roof step's moves among many roofs (`T-M05-002`, part e): a closed roof takes its place, a
 * chip makes it another kind, Join makes two roofs one, Cut to edge trims it to its neighbour, and
 * a roof's row copies or deletes it with what stands on it. Each is one change, with Undo.
 */

type Event<K extends RoofStepEvent['kind']> = Extract<RoofStepEvent, { kind: K }>;

/** What the line said a roof became, while it still says it. */
function becameOf(state: RoofStepState, roof: number): RoofBecame | null {
  if (state.kind !== 'idle') return null;
  const said = state.said;
  const became = said?.kind === 'closed' || said?.kind === 'cut' ? said.became : undefined;
  return became !== undefined && became.roof === roof ? became : null;
}

/** A kind picked: on the line after a close its chip lights and the line stays; from a sheet it is said. */
export function kindMade(
  state: RoofStepState,
  event: Event<'make'>,
  document: StudioDocument,
): RoofStepOutcome {
  const made = roofMadeInto(document, event.roof, event.into, event.facts);
  if (made === document) return stay(state);
  const became = becameOf(state, event.roof);
  const now = becameFacts(made, event.roof, event.facts);
  const said: RoofSaid =
    became === null
      ? { kind: 'made', roof: event.roof, is: now.is, name: now.name }
      : { kind: 'closed', became: { ...became, ...now, beside: now.beside ?? became.beside } };
  return { state: idle(said, event.roof), commit: made };
}

const same = (a: GroundPoint, b: GroundPoint) =>
  Math.hypot(a.east - b.east, a.north - b.north) < CORNER_GAP_M;

/**
 * Each side of a new outline with what the side it came from held: a side that stands where a side
 * of one of the roofs stood keeps that side's trust and settings; a side the join or the cut made
 * is traced, with nothing of its own.
 */
function sidesKept(
  outline: readonly GroundPoint[],
  sources: readonly Roof[],
): { readonly edges: RoofEdgeTrust[]; readonly sides: RoofSide[] } {
  const edges: RoofEdgeTrust[] = [];
  const sides: RoofSide[] = [];
  outline.forEach((from, i) => {
    const to = outline[(i + 1) % outline.length] as GroundPoint;
    let trust: RoofEdgeTrust = 'traced';
    let side: RoofSide = {};
    for (const source of sources) {
      const count = source.corners.length;
      const at = source.corners.findIndex(
        (corner, j) =>
          same(corner, from) && same(source.corners[(j + 1) % count] as GroundPoint, to),
      );
      if (at < 0) continue;
      trust = source.edges[at] ?? 'traced';
      side = source.sides?.length === count ? (source.sides[at] ?? {}) : {};
    }
    edges.push(trust);
    sides.push(side);
  });
  return { edges, sides };
}

/** A roof on a new outline, each side keeping what it held where it still stands. */
function reshaped(roof: Roof, outline: readonly GroundPoint[], sources: readonly Roof[]): Roof {
  const { sides: _sides, ...rest } = roof;
  const kept = sidesKept(outline, sources);
  const own = kept.sides.some((side) => Object.keys(side).length > 0);
  return { ...rest, corners: outline, edges: kept.edges, ...(own ? { sides: kept.sides } : {}) };
}

/** Join: the roof it met takes the joined outline, and the new roof is gone into it. */
export function joinedIn(
  state: RoofStepState,
  event: Event<'join'>,
  document: StudioDocument,
): RoofStepOutcome {
  const fresh = document.roofs[event.roof];
  const target = document.roofs[event.with];
  if (fresh === undefined || target === undefined || event.roof === event.with) return stay(state);
  const one = reshaped(target, event.outline, [target, fresh]);
  const withOne = {
    ...document,
    roofs: document.roofs.map((r, i) => (i === event.with ? one : r)),
  };
  const joined = event.with > event.roof ? event.with - 1 : event.with;
  const commit = withoutRoof(withOne, event.roof);
  const name = roofNameOf(commit, joined) ?? { kind: 'roof', number: joined + 1 };
  return { state: idle({ kind: 'joined', roof: joined, name }, joined), commit };
}

/** Cut to edge: the new roof on the corners it was cut back to, placed again by how it now meets the others. */
export function cutBack(
  state: RoofStepState,
  event: Event<'cut_to_edge'>,
  document: StudioDocument,
): RoofStepOutcome {
  const roof = document.roofs[event.roof];
  if (roof === undefined) return stay(state);
  const cut = reshaped(roof, event.corners, [roof]);
  const placed = placedAt(document, cut, event.roof, event.placing);
  const roofs = document.roofs.map((each, i) => (i === event.roof ? placed.roof : each));
  return {
    state: idle({ kind: 'cut', became: placed.became }, event.roof),
    commit: { ...document, roofs },
  };
}

/** A copy stands this far clear of the roof it was copied from, in metres. */
export const COPY_GAP_M = 1;

/** Where a copy is tried, in this order: east of the roof, then south, west and north. */
const COPY_SIDES = [
  { east: 1, north: 0 },
  { east: 0, north: -1 },
  { east: -1, north: 0 },
  { east: 0, north: 1 },
] as const;

/** How far to move a roof so its copy stands beside it, clear of every roof where there is room. */
function copyMove(document: StudioDocument, roof: Roof): GroundPoint {
  const easts = roof.corners.map((corner) => corner.east);
  const norths = roof.corners.map((corner) => corner.north);
  const wide = Math.max(...easts) - Math.min(...easts) + COPY_GAP_M;
  const deep = Math.max(...norths) - Math.min(...norths) + COPY_GAP_M;
  const moves = COPY_SIDES.map((side) => ({ east: side.east * wide, north: side.north * deep }));
  const clear = moves.find((by) => {
    const moved = roof.corners.map((c) => ({ east: c.east + by.east, north: c.north + by.north }));
    return !document.roofs.some((other) => roofsOverlap(moved, other.corners));
  });
  return clear ?? (moves[0] as GroundPoint);
}

/** Copy: the roof and what goes with it, beside the roof, cutting nothing; the copy is picked. */
export function copied(
  state: RoofStepState,
  event: Event<'copy_roof'>,
  document: StudioDocument,
): RoofStepOutcome {
  const source = document.roofs[event.roof];
  if (source === undefined) return stay(state);
  const group = roofWithItsParts(document, event.roof);
  const corners = group.reduce((sum, i) => sum + (document.roofs[i]?.corners.length ?? 0), 0);
  const full =
    document.roofs.length + group.length > ROOFS_MAX || corners > cornerRoom(document.roofs);
  if (full || event.ids.length < group.length) {
    return stay(idle({ kind: 'refused', refusal: 'too_many_corners' }, event.roof));
  }
  const by = copyMove(document, source);
  const idOf = new Map(
    group.map((i, k) => [(document.roofs[i] as Roof).id, event.ids[k] as string]),
  );
  const copies = group.map((i): Roof => {
    const { on, partOf, ...roof } = document.roofs[i] as Roof;
    return {
      ...roof,
      id: idOf.get(roof.id) as string,
      corners: roof.corners.map((c) => ({ east: c.east + by.east, north: c.north + by.north })),
      // A link inside the group goes to the copy; one out of it stays on the roof it named.
      ...(on === undefined ? {} : { on: idOf.get(on) ?? on }),
      ...(partOf === undefined ? {} : { partOf: idOf.get(partOf) ?? partOf }),
    };
  });
  const copy = document.roofs.length;
  const of = roofNameOf(document, event.roof) ?? { kind: 'roof', number: event.roof + 1 };
  return {
    state: idle({ kind: 'copied', roof: copy, of }, copy),
    commit: { ...document, roofs: [...document.roofs, ...copies] },
  };
}

/** Delete: the roof of a row, or the picked one, goes with what stands on it; the line names it. */
export function deleted(
  state: RoofStepState,
  event: Event<'delete_roof'>,
  document: StudioDocument,
): RoofStepOutcome {
  if (state.kind !== 'idle') return stay(state);
  const roof = event.roof ?? pickedRoofOf(state, document);
  const was = roof === null ? null : roofNameOf(document, roof);
  if (roof === null || was === null) return stay(state);
  return { state: idle({ kind: 'roof_deleted', was }, null), commit: withoutRoof(document, roof) };
}
