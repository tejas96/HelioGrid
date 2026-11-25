import type { Roof } from './document';
import type { GroundPoint } from './ground';
import { cornerAfter } from './roof-shape';

/**
 * What a corner snaps to while drawn or dragged (`T-M05-002`, parts b and e): the design's other
 * roofs — their corners, the middles of their walls and their walls' lines right across the map —
 * and the magnet's holds — square or parallel to the roof's long side (or, for a roof's first side,
 * to the roof beside it), level with an earlier corner — each with the guide line it is held on.
 * Where two lines hold at once, the corner takes the point where they cross.
 */

/** How near a spot must come to snap when no reach is told, in metres: the reach's old fixed size. */
export const SNAP_M = 0.5;
/**
 * How near a new side must come to square with, or parallel to, the roof's long side to be held
 * there, in degrees: gentle, so a wall that is truly a little off is drawn as tapped. A hold never
 * moves the corner more than the reach either, so a long side drawn zoomed out is not pulled far.
 */
export const SNAP_DEGREES = 2;
/**
 * How near a spot must come to snap, on the screen, in CSS pixels: a finger covers more than a
 * mouse. The same on every zoom, so the magnet feels the same zoomed in or out.
 */
export const SNAP_REACH_PX = { touch: 20, mouse: 12 } as const;
/** The reach is never more than this on the ground, in metres, however far out the view is. */
export const SNAP_REACH_MAX_M = 1;
/** A line this many reaches away shows faint before it pulls, so a pull is never a surprise. */
export const SNAP_SOFT_REACHES = 1.5;
/** Two lines give a corner where they cross only when they meet at least this steeply, in degrees. */
export const CROSS_MIN_DEGREES = 10;
/** A corner within this of a roof's wall stands on it, in metres: a snapped corner, less rounding. */
export const ON_WALL_M = 1e-3;

/** The reach on the ground for a view that shows `metresPerPixel`, under a finger or a mouse. */
export function snapReachM(metresPerPixel: number, touch: boolean): number {
  const pixels = touch ? SNAP_REACH_PX.touch : SNAP_REACH_PX.mouse;
  return Math.min(SNAP_REACH_MAX_M, metresPerPixel * pixels);
}

/**
 * Whether the magnet is on (`T-M05-002`, part b): one switch, on until a person turns it off, and
 * off for a moment while Alt is held on a desktop. The account still holds the helpers a person
 * turned off (`studioHelpersOff`, the shape older studios wrote): any one off is the magnet off.
 */
export function magnetOf(off: readonly string[], free: boolean): boolean {
  return !free && off.length === 0;
}

/**
 * Who owns a corner or an edge a spot can snap to: the design's other roofs, and while a roof's
 * faces are drawn by hand, the faces drawn before. The building and its neighbours from the height
 * map join here (part g).
 */
export type SnapOwner =
  | { readonly kind: 'roof'; readonly roof: number }
  | { readonly kind: 'face'; readonly roof: number; readonly face: number };

/** What a spot can snap to besides the roof in hand. */
export interface SnapTargets {
  readonly corners: readonly { readonly at: GroundPoint; readonly owner: SnapOwner }[];
  readonly edges: readonly {
    readonly from: GroundPoint;
    readonly to: GroundPoint;
    readonly owner: SnapOwner;
  }[];
}

export const NO_SNAP_TARGETS: SnapTargets = { corners: [], edges: [] };

/** The corners and edges of the design's roofs, except the roof at `except` — the one in hand. */
export function snapTargetsOf(roofs: readonly Roof[], except?: number): SnapTargets {
  const others = roofs.flatMap((roof, index) =>
    index === except ? [] : [{ roof, owner: { kind: 'roof', roof: index } as const }],
  );
  return {
    corners: others.flatMap(({ roof, owner }) => roof.corners.map((at) => ({ at, owner }))),
    edges: others.flatMap(({ roof, owner }) =>
      roof.corners.map((from, i) => ({ from, to: cornerAfter(roof.corners, i), owner })),
    ),
  };
}

/** One line a spot is held on, as its small label names it. */
export type RoofHold =
  | { readonly kind: 'corner_of'; readonly owner: SnapOwner }
  | { readonly kind: 'edge_of'; readonly owner: SnapOwner }
  /** On the line of another roof's wall, past the wall's end. */
  | { readonly kind: 'wall_line'; readonly owner: SnapOwner }
  /** On the middle of another roof's wall. */
  | { readonly kind: 'middle_of'; readonly owner: SnapOwner }
  /** A roof's first side, square or parallel to the roof beside it. */
  | { readonly kind: 'frame'; readonly along: 'square' | 'parallel'; readonly owner: SnapOwner }
  /** Level with another roof's corner, along the roof in hand, when the two are not square. */
  | { readonly kind: 'lines_up_with'; readonly owner: SnapOwner }
  /** Against the inside of a roof's parapet: a roof dragged onto it stands clear of the wall. */
  | { readonly kind: 'inside_parapet'; readonly owner: SnapOwner }
  /** Square to the roof's long side. */
  | { readonly kind: 'square' }
  /** Parallel to the roof's long side. */
  | { readonly kind: 'parallel' }
  /**
   * Level with an earlier corner (`corner`, from 0): an L closes straight; `along` when the side is
   * held square or parallel as well.
   */
  | {
      readonly kind: 'lines_up';
      readonly corner: number;
      readonly along: 'square' | 'parallel' | null;
    }
  /** A corner dragged into a square corner. */
  | { readonly kind: 'square_corner' }
  /** A set length kept: the corner runs on the circle of `metres` round `centre`. */
  | { readonly kind: 'held'; readonly metres: number; readonly centre: GroundPoint };

/** What a spot snapped to: one hold, or the point where two cross. */
export type RoofSnap =
  | RoofHold
  | { readonly kind: 'cross'; readonly first: RoofHold; readonly second: RoofHold };

/**
 * A guide drawn across the map: the line through `through`, running `way` (one metre long).
 * `soft`: a line near the spot that does not pull it yet, drawn faint.
 */
export interface Guide {
  readonly through: GroundPoint;
  readonly way: GroundPoint;
  readonly soft?: true;
}

/** A guide through `through`, running `way`, scaled to one metre. */
export function guideOf(through: GroundPoint, way: GroundPoint): Guide {
  const reach = Math.hypot(way.east, way.north) || 1;
  return { through, way: { east: way.east / reach, north: way.north / reach } };
}

export interface Snapped {
  readonly point: GroundPoint;
  readonly snap: RoofSnap | null;
  /** The lines the spot is held on, drawn dashed across the map; none when nothing holds it. */
  readonly guides: readonly Guide[];
}
