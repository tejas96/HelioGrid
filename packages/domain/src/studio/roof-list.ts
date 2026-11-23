import type { RoofMaterial } from './roof-material';
import type { RoofName } from './roof-names';
import type { RoofKind } from './roof-parts';

/**
 * Roofs, the one sheet that holds every roof (`T-M05-002`, part e): a row for each with what it is,
 * its name, where it sits, what it is made of and its area; what stands on a roof right under that
 * roof's row; and what still waits for a person to check. The kernel fills it
 * (`roof-list-build.ts`); a screen only draws it.
 */

/** Where a roof sits, said on its row. */
export type RoofSits =
  /** The first roof on the ground: the main roof. */
  | { readonly kind: 'main' }
  /** Another roof on the ground that meets none. */
  | { readonly kind: 'ground' }
  /** On the ground, against another roof. */
  | { readonly kind: 'beside'; readonly roof: RoofName }
  /** Standing on a roof, this high above it. */
  | { readonly kind: 'above'; readonly roof: RoofName; readonly metres: number }
  /** Cut in a roof, or cut into its faces. */
  | { readonly kind: 'in'; readonly roof: RoofName }
  /** Carved out of a roof, with its own roof type. */
  | { readonly kind: 'part_of'; readonly roof: RoofName };

export interface RoofRow {
  /** The roof, by its place in the design. */
  readonly roof: number;
  readonly kind: RoofKind;
  readonly name: RoofName;
  readonly sits: RoofSits;
  /** What it is made of, and whether a person confirmed it; `null` for a hole, made of nothing. */
  readonly material: {
    readonly type: RoofMaterial;
    /** The name a person typed for a type of their own. */
    readonly name: string | null;
    readonly confirmed: boolean;
  } | null;
  /** Its own area: from above where it is flat, along its slope where it slopes. */
  readonly areaM2: number;
  /** It sits under the row of the roof it stands on or is part of. */
  readonly child: boolean;
  /** Its material, or what the studio guessed it is, waits for a person to check. */
  readonly waits: boolean;
}

export interface RoofList {
  /** The rows in the order shown: each roof on the ground, then what stands on it. */
  readonly rows: readonly RoofRow[];
  /** How many roofs the design holds: a hole is no roof. */
  readonly count: number;
  /** The area of every roof together, every spot once as seen from above. */
  readonly areaM2: number;
  /** How many rows wait for a person to check: the pencil's badge is amber while any does. */
  readonly waiting: number;
}

export const NO_ROOF_LIST: RoofList = { rows: [], count: 0, areaM2: 0, waiting: 0 };
