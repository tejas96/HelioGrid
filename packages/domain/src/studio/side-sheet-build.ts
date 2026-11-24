import { compassOf } from './compass';
import type { Roof, StudioDocument } from './document';
import { roofFormOf } from './roof-built';
import { gableEnds } from './roof-forms';
import { roofKindOf, roofSidesOf } from './roof-kind';
import { type RoofFacts, roofShapeNow, roofSloped } from './roof-levels';
import type { RoofShape } from './roof-material';
import { PARAPET_CHECK_ABOVE_M } from './roof-numbers';
import type { EdgeStretch } from './roof-open-edges';
import { nameOf, ONE_WAY } from './roof-sheet-build';
import type { SideRole, SideSheetRows, SideWallWhy } from './roof-sheet-rows';
import { formPicksOf, glassSideOf, lowSideOf, sideBearing } from './roof-slope-way';
import { roofNumberOf } from './roof-values';
import type { RoofsWorked } from './roof-worked';

/**
 * A side's sheet from the design and what the kernel worked out of it (`T-M05-002`, part e, board
 * 6.3): which way it looks, its parapet, its setback and overhang, and its role in the shape.
 */

/** The shapes whose ends are a gable end or a hip. */
const ENDED: readonly RoofShape[] = ['gable', 'hip'];
/** The shapes built from each side's own face, so a side may keep its own slope and eave. */
const SIDED: readonly RoofShape[] = ['gable', 'hip', 'mansard', 'gambrel'];
/** The shapes whose ends start as gable ends. */
const GABLED: readonly RoofShape[] = ['gable', 'gambrel'];

/** Whether a side rises as a face of its own: a side of a sided roof that is not a gable end. */
function risesOwn(
  document: StudioDocument,
  index: number,
  side: number,
  facts: RoofFacts,
  latitude: number,
): boolean {
  const roof = document.roofs[index] as Roof;
  const shape = roofShapeNow(roof, facts);
  if (!SIDED.includes(shape)) return false;
  const end = roofSidesOf(roof)[side]?.end;
  if (end === 'gable' || end === 'hip') return end === 'hip';
  if (!GABLED.includes(shape)) return true;
  const turned = roofFormOf(roof, facts, formPicksOf(document, index, facts, latitude)).turned;
  return !gableEnds(roof.corners, turned === true).includes(side);
}

/** What a side is to its roof's shape, where the shape gives its sides a role. */
function roleOf(
  document: StudioDocument,
  index: number,
  side: number,
  facts: RoofFacts,
  latitude: number,
): SideRole | null {
  const roof = document.roofs[index] as Roof;
  const shape = roofShapeNow(roof, facts);
  if (ONE_WAY.includes(shape)) {
    return { kind: 'low', is: lowSideOf(document, index, facts, latitude).side === side };
  }
  if (shape === 'sawtooth') {
    const stored = roofSidesOf(roof).findIndex((each) => each.glass !== undefined);
    const glass = stored >= 0 ? stored : glassSideOf(roof.corners, latitude).side;
    return { kind: 'glass', is: glass === side };
  }
  if (!ENDED.includes(shape)) return null;
  const turned = roofFormOf(roof, facts, formPicksOf(document, index, facts, latitude)).turned;
  if (!gableEnds(roof.corners, turned === true).includes(side)) return null;
  const own = roofSidesOf(roof)[side]?.end;
  // A stored end this build does not know reads as the shape's own.
  const end =
    own === 'gable' ? 'gable' : own === 'hip' ? 'hip' : shape === 'gable' ? 'gable' : 'hip';
  return { kind: 'end', end };
}

/** Why a side has its parapet or not: a person's choice, a roof met there, or the roof's own. */
function whyOf(
  document: StudioDocument,
  roof: Roof,
  side: number,
  stretches: readonly EdgeStretch[],
): SideWallWhy {
  if (roofSidesOf(roof)[side]?.parapet !== undefined) return { kind: 'person' };
  const taken = stretches.find((stretch) => stretch.other !== null);
  return taken?.other != null && taken.state !== 'open' && taken.state !== 'person'
    ? { kind: taken.state, with: nameOf(document, taken.other) }
    : { kind: 'roof' };
}

/** One side's sheet: which way it looks, its parapet and its setback, and its role in the shape. */
export function sideSheetRowsOf(
  document: StudioDocument,
  index: number,
  side: number,
  facts: RoofFacts,
  worked: RoofsWorked,
  latitude: number,
): SideSheetRows | null {
  const roof = document.roofs[index];
  if (roof === undefined || side < 0 || side >= roof.corners.length) return null;
  const stretches = worked.edges[index]?.[side] ?? [];
  const on = stretches.some((stretch) => stretch.wall);
  const why = whyOf(document, roof, side, stretches);
  const parapetHeight = on
    ? roofNumberOf(document, { roof: index, key: 'parapet_height', side }, facts)
    : null;
  const setback = roofNumberOf(document, { roof: index, key: 'setback', side }, facts);
  if (setback === null) return null;
  // A side another roof meets has no overhang: its wall stands at the outline, against that roof.
  const met = stretches.some((stretch) => stretch.state !== 'open' && stretch.other !== null);
  const overhang =
    roofSloped(roof, facts) && !met
      ? roofNumberOf(document, { roof: index, key: 'overhang', side }, facts)
      : null;
  const rises = risesOwn(document, index, side, facts, latitude);
  const own = (key: 'slope' | 'eave') =>
    rises ? roofNumberOf(document, { roof: index, key, side }, facts) : null;
  // A hole has no top to take a shape; an open shed's sheet slopes as any roof's does.
  const role = roofKindOf(roof) === 'hole' ? null : roleOf(document, index, side, facts, latitude);
  const low = role?.kind === 'low' && role.is ? lowSideOf(document, index, facts, latitude) : null;
  const bearing = sideBearing(roof.corners, side);
  const heightWaits = parapetHeight !== null && parapetHeight.value > PARAPET_CHECK_ABOVE_M;
  return {
    roof: index,
    side,
    name: nameOf(document, index),
    faces: compassOf(bearing),
    bearing,
    parapet: { on, why },
    parapetHeight,
    setback,
    overhang,
    slope: own('slope'),
    eave: own('eave'),
    role,
    heightWaits,
    waits: heightWaits || (low?.againstWall ?? null) !== null,
  };
}
