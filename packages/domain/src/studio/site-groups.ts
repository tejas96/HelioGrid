import { type GroundPoint, meanOf } from './ground';

/**
 * The calls a site's height map takes (`T-M05-002`, part g): Google gives at most 100 m round a
 * point at the sharpest detail, so roofs far apart — a campus — each get a call of their own. A
 * house is one call round the pin.
 */

export interface RoofGroup {
  readonly middle: GroundPoint;
  /** Which of the middles asked for fall in it, by their place in the list. */
  readonly members: readonly number[];
  /** Metres round the middle the call asks for. */
  readonly radiusM: number;
}

/** Roofs within this of a group's middle join it. */
const GROUP_APART_M = 70;
/** A call reaches this far past its roofs, so what shades them is read too. */
const SHADE_REACH_M = 30;
/** Google's widest radius at the sharpest detail. */
export const CALL_RADIUS_MAX_M = 100;
/** The call round the pin, before any roof, sees the street and the neighbours. */
const PIN_RADIUS_M = 50;

const PIN = { east: 0, north: 0 };

/**
 * The groups the roofs' middles fall in, the pin's first. The pin's group stays centred on the
 * pin, so drawing a roof near the house never moves its call: the answer kept for it serves on.
 * Any other group is centred on its roofs.
 */
export function roofGroupsOf(middles: readonly GroundPoint[]): RoofGroup[] {
  const groups: GroundPoint[][] = [[PIN]];
  const members: number[][] = [[]];
  const middleOfGroup = (members: readonly GroundPoint[], i: number) =>
    i === 0 ? PIN : meanOf(members);
  middles.forEach((middle, index) => {
    const near = groups.findIndex((points, i) => {
      const at = middleOfGroup(points, i);
      return Math.hypot(at.east - middle.east, at.north - middle.north) <= GROUP_APART_M;
    });
    if (near < 0) {
      groups.push([middle]);
      members.push([index]);
    } else {
      groups[near]?.push(middle);
      members[near]?.push(index);
    }
  });
  return groups.map((points, i) => {
    const middle = middleOfGroup(points, i);
    const spread = Math.max(
      ...points.map((p) => Math.hypot(p.east - middle.east, p.north - middle.north)),
    );
    const radiusM = Math.min(
      CALL_RADIUS_MAX_M,
      Math.max(i === 0 ? PIN_RADIUS_M : 0, Math.ceil(spread + SHADE_REACH_M)),
    );
    return { middle, members: members[i] ?? [], radiusM };
  });
}
