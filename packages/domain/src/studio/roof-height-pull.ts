import type { GroundPoint } from './ground';
import type { RoofName } from './roof-names';

/**
 * Where a roof's height pulls to as its arrow is dragged (`T-M05-002`, part e): a fact the studio's
 * kernel works out (`roof-height-magnet.ts`) and a screen draws as a level line with a tag.
 */

/** What a height pulled level with. */
export type HeightLevel =
  /** Another roof's top, the top of its parapet, or its ridge. */
  | {
      readonly kind: 'roof_top' | 'parapet_top' | 'ridge';
      readonly roof: number;
      readonly name: RoofName;
    }
  /** A wall dragged level with the roof's other sides. */
  | { readonly kind: 'other_sides' }
  /** A whole floor: 0 is the ground floor's roof, 1 the floor above it. */
  | { readonly kind: 'floor'; readonly floors: number }
  /** A round value: said by the number alone. */
  | { readonly kind: 'round' }
  /** The measured eave of a building beside the roof, from the height map (`T-M05-002`, part g). */
  | { readonly kind: 'eave' }
  /** The height map's own reading inside the roof: the fit check's level. */
  | { readonly kind: 'height_map' };

/** What the site data gives a dragged height to pull to: eaves near the roof, the map inside it. */
export interface SiteLevels {
  /** Each eave's line and its height above the ground. */
  readonly eaves: readonly {
    readonly from: GroundPoint;
    readonly to: GroundPoint;
    readonly heightM: number;
  }[];
  /** The height map's top inside the roof above the ground, where it reads one. */
  readonly mapM: number | null;
}

export interface HeightPull {
  /** The roof's own height once pulled, in metres. */
  readonly metres: number;
  /** That height above the ground: where the level line runs. */
  readonly levelM: number;
  readonly to: HeightLevel;
  /** The level line on the plan: along the roof it pulled to, then along the dragged roof. */
  readonly line: readonly GroundPoint[];
}

/** A height within this of a level pulls to it, in metres. */
export const HEIGHT_PULL_M = 0.1;
/** However far out the view is, a height never pulls from farther than this. */
export const HEIGHT_PULL_MAX_M = 0.3;
