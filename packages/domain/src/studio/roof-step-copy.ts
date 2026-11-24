import { cornerRoom, ROOFS_MAX, type Roof, type StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofWithItsParts } from './roof-kind';
import { roofPlaced } from './roof-move';
import { roofNameOf } from './roof-names';
import { roofsOverlap } from './roof-shape';
import { pickedRoofOf, withoutRoof } from './roof-step-draw';
import {
  idle,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';
import { roofSetFree } from './roof-sticks-out';

/**
 * Copy and Delete (`T-M05-002`, part e): a roof goes, or is copied beside itself, with what stands
 * on it. Each is one change, with Undo, and the line names the roof.
 */

type Event<K extends RoofStepEvent['kind']> = Extract<RoofStepEvent, { kind: K }>;

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
    const { on, partOf, ...roof } = roofPlaced(document.roofs[i] as Roof, (c) => ({
      east: c.east + by.east,
      north: c.north + by.north,
    }));
    return {
      ...roof,
      id: idOf.get(roof.id) as string,
      // A link inside the group goes to the copy; one out of it stays on the roof it named.
      ...(on === undefined ? {} : { on: idOf.get(on) ?? on }),
      ...(partOf === undefined ? {} : { partOf: idOf.get(partOf) ?? partOf }),
    };
  });
  const copy = document.roofs.length;
  const of = roofNameOf(document, event.roof) ?? { kind: 'roof', number: event.roof + 1 };
  // A stair room copied lands clear of the roof it stood on: its copy is its own roof, not one
  // still tied to a roof it no longer lies on.
  const commit = roofSetFree({ ...document, roofs: [...document.roofs, ...copies] }, copy);
  return { state: idle({ kind: 'copied', roof: copy, of }, copy), commit };
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
