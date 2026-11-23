import type { StudioDocument } from './document';
import { roofMaterialConfirmed, roofMaterialPicked } from './roof-material-set';
import { roofWithSideWall } from './roof-sides';
import {
  idle,
  type RoofStepEvent,
  type RoofStepOutcome,
  type RoofStepState,
  stay,
} from './roof-step-state';

/**
 * What a person sets on one roof from its marks and its row (`T-M05-002`, part e): a side's wall,
 * and what the roof is made of. Each is one change, with Undo, and the roof stays picked.
 */

type Event<K extends RoofStepEvent['kind']> = Extract<RoofStepEvent, { kind: K }>;

/** A side's dot tapped: the wall on that side is the person's from now on; the roof stays picked. */
export function sideWalled(
  state: RoofStepState,
  event: Event<'side_wall'>,
  document: StudioDocument,
): RoofStepOutcome {
  const roof = document.roofs[event.roof];
  if (state.kind !== 'idle' || roof === undefined) return stay(state);
  const next = roofWithSideWall(roof, event.side, event.wall);
  if (next === roof) return stay(state);
  const { roof: at, side, wall, walled } = event;
  const said = {
    kind: 'side_wall',
    roof: at,
    side,
    wall,
    walled,
    sides: roof.corners.length,
  } as const;
  return {
    state: idle(said, at),
    commit: { ...document, roofs: document.roofs.map((each, i) => (i === at ? next : each)) },
  };
}

/** What a roof is made of, picked or confirmed: one change, and the roof stays picked. */
export function materialSet(
  state: RoofStepState,
  event: Event<'material'>,
  document: StudioDocument,
): RoofStepOutcome {
  if (state.kind !== 'idle') return stay(state);
  const commit =
    event.pick === undefined
      ? roofMaterialConfirmed(document, event.roof)
      : roofMaterialPicked(document, event.roof, event.pick);
  if (commit === document) return stay(state);
  return { state: idle({ kind: 'material_set', roof: event.roof }, event.roof), commit };
}
