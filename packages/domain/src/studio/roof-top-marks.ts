import type { GroundPoint } from './ground';
import type { RoofName } from './roof-names';
import type { RoofKind } from './roof-parts';

/**
 * What the top view marks on each roof (`T-M05-002`, part e): which stretches of its sides have a
 * wall, how high it stands on the roof under it, how far it sticks out
 * past that roof, and which way each sloped face runs down. The kernel fills it
 * (`roof-top-marks-build.ts`); a screen only draws it.
 */

/** A stretch of one side: solid where it has a wall, dashed where it has none. */
export interface SideStretchMark {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  readonly wall: boolean;
}

/** Why a stretch has no wall of its own: another roof takes it. */
export interface NoWallWhy {
  readonly at: GroundPoint;
  /** `shared`: a roof of the same height meets it. `under`: a higher roof's wall stands there. */
  readonly why: 'shared' | 'under';
  /** That roof, by its place in the design, and what it is called. */
  readonly other: number;
  readonly name: RoofName;
}

export interface RoofTopMark {
  readonly kind: RoofKind;
  /** What it is called: "Roof 2" on the ground, its kind on another roof. */
  readonly name: RoofName;
  /** Each side's stretches, in the order of the roof's sides. */
  readonly sides: readonly (readonly SideStretchMark[])[];
  /** Its height above the roof it stands on, said on it as "+3 m"; `null` for a roof on the ground. */
  readonly aboveM: number | null;
  /** How far it sticks out past the roof it lies on, in metres; 0 within it. */
  readonly sticksOutM: number;
  /** The corner of it farthest past that roof, where the tag sits; `null` within it. */
  readonly sticksOutAt: GroundPoint | null;
  /**
   * The faces drawn by hand on an Any-shape roof, each a ring of corners: drawn as the person
   * draws them, before they cover the roof and after.
   */
  readonly faces: readonly (readonly GroundPoint[])[];
  /** A short line down each sloped face, from higher to lower. */
  readonly slopes: readonly { readonly from: GroundPoint; readonly to: GroundPoint }[];
  /** The first stretch another roof takes the wall from; `null` where none does. */
  readonly noWall: NoWallWhy | null;
  /** Its setback line, ring by ring: drawn orange and dashed, round what stands on it too. */
  readonly setback: readonly (readonly GroundPoint[])[];
  /** Its low side against a taller roof's wall, where the tag sits; `null` where it is not. */
  readonly lowAgainst: { readonly at: GroundPoint; readonly roof: RoofName } | null;
}
