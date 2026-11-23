import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import {
  type LaidPicture,
  type LaidPlan,
  PICTURE_METRES_PER_UNIT_MAX,
  PICTURE_METRES_PER_UNIT_MIN,
  PICTURE_TURN_STEP_DEG,
  PLAN_SEE_THROUGH_MAX,
  PLAN_SEE_THROUGH_MIN,
  PLAN_SEE_THROUGH_START,
} from './own-picture';

/**
 * What a person does with a picture of the company's own (`T-M05-002d`), each one change of the
 * document, so each is one Undo. The picture's stored files never change: only where it lies does.
 * A photo or a drone map becomes the ground and is the picture shown; a plan lies over whichever
 * ground shows.
 */

const FULL_TURN_DEG = 360;
const HALF_TURN_DEG = 180;

/** A turn in (−180, 180]: −180 is +180, as the document stores it. */
export function turnInRange(deg: number): number {
  const turned =
    ((((deg + HALF_TURN_DEG) % FULL_TURN_DEG) + FULL_TURN_DEG) % FULL_TURN_DEG) - HALF_TURN_DEG;
  return turned === -HALF_TURN_DEG ? HALF_TURN_DEG : turned;
}

/** A turn a person sets: to the nearest 5°. */
export function turnStepped(deg: number): number {
  return turnInRange(Math.round(deg / PICTURE_TURN_STEP_DEG) * PICTURE_TURN_STEP_DEG);
}

/** A newer photo or drone map of the company's own laid as the ground, and shown. */
export function ownPictureLaid(document: StudioDocument, laid: LaidPicture): StudioDocument {
  return { ...document, picture: 'own', ownPicture: laid };
}

/** A plan laid over the ground, see-through at its start, neither locked nor hidden. */
export function planLaid(
  document: StudioDocument,
  laid: LaidPicture,
  page: number,
): StudioDocument {
  const plan: LaidPlan = {
    ...laid,
    seeThrough: PLAN_SEE_THROUGH_START,
    locked: false,
    hidden: false,
    page,
  };
  return { ...document, plan };
}

/** The ground's own picture taken off: the roofs stay where they are, and the sky picture shows. */
export function ownPictureRemoved(document: StudioDocument): StudioDocument {
  return {
    ...document,
    picture: document.picture === 'own' ? null : document.picture,
    ownPicture: null,
  };
}

export function planRemoved(document: StudioDocument): StudioDocument {
  return { ...document, plan: null };
}

/** The ground's own picture turned so its north is up, to the nearest 5°. */
export function ownPictureTurned(document: StudioDocument, deg: number): StudioDocument {
  const own = document.ownPicture;
  return own == null
    ? document
    : { ...document, ownPicture: { ...own, turnDeg: turnStepped(deg) } };
}

type PlanChange = Partial<
  Pick<
    LaidPlan,
    'at' | 'turnDeg' | 'seeThrough' | 'locked' | 'hidden' | 'page' | 'metresPerUnit' | 'scaleFrom'
  >
>;

/** The plan changed; a locked plan neither moves nor turns, and nothing here changes a missing one. */
function planChanged(document: StudioDocument, change: PlanChange): StudioDocument {
  const plan = document.plan;
  if (plan == null) return document;
  const moving = change.at !== undefined || change.turnDeg !== undefined;
  if (moving && plan.locked) return document;
  return { ...document, plan: { ...plan, ...change } };
}

export const planMoved = (document: StudioDocument, at: GroundPoint): StudioDocument =>
  planChanged(document, { at });

export const planTurned = (document: StudioDocument, deg: number): StudioDocument =>
  planChanged(document, { turnDeg: turnStepped(deg) });

/** How much of the plan shows, in its slider's steps and range. */
export function planSeenThrough(document: StudioDocument, percent: number): StudioDocument {
  const seeThrough = Math.round(
    Math.min(PLAN_SEE_THROUGH_MAX, Math.max(PLAN_SEE_THROUGH_MIN, percent)),
  );
  return planChanged(document, { seeThrough });
}

export const planLocked = (document: StudioDocument, locked: boolean): StudioDocument =>
  planChanged(document, { locked });

export const planHidden = (document: StudioDocument, hidden: boolean): StudioDocument =>
  planChanged(document, { hidden });

/** Another page of the plan laid in the same place (`T-M05-002d`, ruling 6). */
export const planPaged = (document: StudioDocument, page: number): StudioDocument =>
  planChanged(document, { page });

/**
 * The plan's unit picked by a person, for a DXF that names none: the plan re-sized at once about
 * its drawing's middle, which stays on the house. `null` for a scale no plan has.
 */
export function planUnitPicked(
  document: StudioDocument,
  metresPerUnit: number,
  drawing: {
    readonly west: number;
    readonly south: number;
    readonly east: number;
    readonly north: number;
  },
): StudioDocument | null {
  const plan = document.plan;
  if (
    plan == null ||
    metresPerUnit < PICTURE_METRES_PER_UNIT_MIN ||
    metresPerUnit > PICTURE_METRES_PER_UNIT_MAX
  ) {
    return null;
  }
  const x = (drawing.west + drawing.east) / 2;
  const y = (drawing.south + drawing.north) / 2;
  const middle = laidOnGround(plan, x, y);
  const resized = laidOnGround({ ...plan, metresPerUnit, at: { east: 0, north: 0 } }, x, y);
  const at = { east: middle.east - resized.east, north: middle.north - resized.north };
  // A lock holds the plan in place, not its unit: the middle stays, so a locked plan re-sizes too.
  return { ...document, plan: { ...plan, metresPerUnit, scaleFrom: 'person', at } };
}

/** A point of a laid picture or plan, in its own units (y up), on the site's ground. */
export function laidOnGround(laid: LaidPicture, x: number, y: number): GroundPoint {
  const turn = (laid.turnDeg * Math.PI) / HALF_TURN_DEG;
  const east = x * laid.metresPerUnit;
  const north = y * laid.metresPerUnit;
  // Clockwise from north, as a compass turns.
  return {
    east: laid.at.east + east * Math.cos(turn) + north * Math.sin(turn),
    north: laid.at.north - east * Math.sin(turn) + north * Math.cos(turn),
  };
}

/** A spot on the ground, in a laid picture's or plan's own units (y up): `laidOnGround` undone. */
export function groundOnLaid(
  laid: LaidPicture,
  spot: GroundPoint,
): { readonly x: number; readonly y: number } {
  const turn = (laid.turnDeg * Math.PI) / HALF_TURN_DEG;
  const east = spot.east - laid.at.east;
  const north = spot.north - laid.at.north;
  return {
    x: (east * Math.cos(turn) - north * Math.sin(turn)) / laid.metresPerUnit,
    y: (east * Math.sin(turn) + north * Math.cos(turn)) / laid.metresPerUnit,
  };
}

/** Where a plan first lies: the middle of what it draws on the pin, as drawn. */
export function planCentredOnPin(
  extent: {
    readonly west: number;
    readonly south: number;
    readonly east: number;
    readonly north: number;
  },
  metresPerUnit: number,
): GroundPoint {
  return {
    east: (-(extent.west + extent.east) / 2) * metresPerUnit,
    north: (-(extent.south + extent.north) / 2) * metresPerUnit,
  };
}
