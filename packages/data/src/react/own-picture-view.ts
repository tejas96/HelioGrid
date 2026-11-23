import type { DesignPictureWire, PlanLines } from '@heliogrid/contracts';
import {
  type GroundBox,
  type GroundPoint,
  type LaidPicture,
  type LaidPlan,
  laidOnGround,
  lengthIsFirst,
  METRES_PER_PLAN_UNIT,
  type OwnPictureSay,
  PLAN_UNITS,
  type PlanUnit,
  type Read,
  roofsOnPlan,
  type StudioDocument,
  turnStepped,
} from '@heliogrid/domain';
import type { StudioPicture } from './studio-document-state';

/**
 * Your picture's view, as the studio draws it (`T-M05-002d`): the plan where it lies with its
 * handles, its unit card, where a drag of a handle leaves it, and the ground of what just landed.
 */

/** The plan as the studio draws it: where it lies, its lines on the page laid, and its facts. */
export interface PlanShown {
  readonly name: string;
  readonly laid: LaidPlan;
  readonly lines: PlanLines;
  readonly pages: number;
  /** Picked: its handles and its card show. */
  readonly picked: boolean;
  /** Where its move handle stands — its middle — and its turn handle, past its north edge. */
  readonly middle: GroundPoint;
  readonly turnAt: GroundPoint;
}

/** The unit card of a plan that named none: our guess picked, the others a tap away. */
export interface UnitCard {
  readonly unit: PlanUnit | null;
  readonly units: readonly PlanUnit[];
  /** The plan's long side in metres at the unit picked: the card's line. */
  readonly longSideM: number;
  readonly shortSideM: number;
}

/** The ground a laid picture or plan covers: the corners of its boxes, laid. */
function laidBox(
  laid: LaidPicture,
  boxes: readonly {
    readonly west: number;
    readonly south: number;
    readonly east: number;
    readonly north: number;
  }[],
): GroundBox | null {
  const corners = boxes.flatMap((box) => [
    laidOnGround(laid, box.west, box.south),
    laidOnGround(laid, box.east, box.south),
    laidOnGround(laid, box.east, box.north),
    laidOnGround(laid, box.west, box.north),
  ]);
  if (corners.length === 0) return null;
  return {
    west: Math.min(...corners.map((c) => c.east)),
    east: Math.max(...corners.map((c) => c.east)),
    south: Math.min(...corners.map((c) => c.north)),
    north: Math.max(...corners.map((c) => c.north)),
  };
}

/** What the bar says now: an act just done first, then what the design asks for next. */
export function ownSayOf(
  said: OwnPictureSay | null,
  document: StudioDocument | null,
  picture: StudioPicture,
  plan: PlanShown | null,
): OwnPictureSay | null {
  if (said !== null) return said;
  if (document === null) return null;
  const roofsOnOwn = document.roofs.some((roof) => roof.tracedOn === 'own');
  const resting = plan !== null && !plan.picked && !plan.laid.locked && !plan.laid.hidden;
  if (resting && document.roofs.length === 0) return 'tap_outline';
  if (roofsOnPlan(document, planOutlinesOf(plan)).length > 0) return 'plan_to_size';
  if (picture.kind !== 'own') return null;
  const scale = document.ownPicture?.scaleFrom;
  if (picture.pictureKind === 'drone' && scale === 'file' && document.roofs.length === 0) {
    return 'drone_in_place';
  }
  if (!roofsOnOwn) return null;
  if (scale === 'guess') return lengthIsFirst(document, 'own') ? 'set_one_length' : null;
  return scale === 'person' ? 'photo_to_size' : null;
}

/** The turn handle stands this far past the plan's north edge, in metres. */
const TURN_HANDLE_OUT_M = 1.5;
const HALF_TURN_DEG = 180;

export function planShownOf(
  laid: LaidPlan | null,
  picture: DesignPictureWire | null,
  lines: Read<PlanLines>,
  picked: boolean,
): PlanShown | null {
  if (laid === null || picture === null || lines.kind !== 'ready') return null;
  const pages = picture.facts?.pages ?? 1;
  const { west, east, south, north } = lines.value.extent;
  const middle = laidOnGround(laid, (west + east) / 2, (south + north) / 2);
  const out = TURN_HANDLE_OUT_M / laid.metresPerUnit;
  const turnAt = laidOnGround(laid, (west + east) / 2, north + out);
  return { name: picture.name, laid, lines: lines.value, pages, picked, middle, turnAt };
}

/** The bearing from one spot to another, clockwise from north, in degrees. */
const bearing = (from: GroundPoint, to: GroundPoint) =>
  (Math.atan2(to.east - from.east, to.north - from.north) * HALF_TURN_DEG) / Math.PI;

/** Where a handle's drag leaves the plan: carried by the move handle, turned about its middle. */
export function planDragged(
  laid: LaidPlan,
  middle: GroundPoint,
  handle: 'move' | 'turn',
  from: GroundPoint,
  to: GroundPoint,
): { readonly at: GroundPoint; readonly turnDeg: number } {
  if (handle === 'move') {
    const at = {
      east: laid.at.east + to.east - from.east,
      north: laid.at.north + to.north - from.north,
    };
    return { at, turnDeg: laid.turnDeg };
  }
  const by = bearing(middle, to) - bearing(middle, from);
  const turnDeg = turnStepped(laid.turnDeg + by);
  // Turned about its middle: its origin swings round the middle by the same turn.
  const swing = ((turnDeg - laid.turnDeg) * Math.PI) / HALF_TURN_DEG;
  const dx = laid.at.east - middle.east;
  const dy = laid.at.north - middle.north;
  const at = {
    east: middle.east + dx * Math.cos(swing) + dy * Math.sin(swing),
    north: middle.north - dx * Math.sin(swing) + dy * Math.cos(swing),
  };
  return { at, turnDeg };
}

/** The plan's closed outlines in its own units: the roofs made from them are sized with it. */
export function planOutlinesOf(plan: PlanShown | null): readonly (readonly number[])[] {
  return plan?.lines.lines.flatMap((line) => (line.closed ? [line.points] : [])) ?? [];
}

export function unitCardOf(plan: PlanShown | null): UnitCard | null {
  if (plan === null) return null;
  const { metresPerUnit } = plan.laid;
  return { unit: unitOf(metresPerUnit), units: PLAN_UNITS, ...sidesOf(plan.lines, metresPerUnit) };
}

/** The ground of what just landed: the plan's drawing, or your picture's pieces. */
export function landedBoxOf(
  landing: 'plan' | 'picture' | null,
  plan: PlanShown | null,
  picture: StudioPicture,
): GroundBox | null {
  if (landing === 'plan' && plan !== null) return laidBox(plan.laid, [plan.lines.extent]);
  if (landing === 'picture' && picture.kind === 'own') return laidBox(picture.laid, picture.pieces);
  return null;
}

function sidesOf(lines: PlanLines, metresPerUnit: number) {
  const across = (lines.extent.east - lines.extent.west) * metresPerUnit;
  const along = (lines.extent.north - lines.extent.south) * metresPerUnit;
  return { longSideM: Math.max(across, along), shortSideM: Math.min(across, along) };
}

function unitOf(metresPerUnit: number): PlanUnit | null {
  return (
    PLAN_UNITS.find((unit) => Math.abs(METRES_PER_PLAN_UNIT[unit] / metresPerUnit - 1) < 1e-9) ??
    null
  );
}
