/**
 * The words roof looks are told in (`T-M05-002`, part e, roof looks): the looks, the colours a
 * roof can be, a ridge's cap, what a design's flat roofs wear, and one roof's skin. They name
 * nothing else, so the document and the 3D model can both read them.
 */

/** The looks, one per pattern; materials that share a pattern differ only by colour. */
export const LOOK_FAMILIES = [
  'trapezoidal',
  'corrugated',
  'cement_sheet',
  'standing_seam',
  'tile',
  'slate',
  'shingle',
  'shake',
  'concrete',
  'terrace_tile',
  'stone_slab',
  'membrane',
  'gravel',
  'grass',
  'thatch',
  'glass',
  'polycarbonate',
] as const;
export type LookFamily = (typeof LOOK_FAMILIES)[number];

/** Every colour a roof can be, by name; the theme gives each its `scene-roof-<name>` colour. */
export const ROOF_SWATCHES = [
  'white',
  'light_grey',
  'galvanised',
  'blue',
  'green',
  'red',
  'brown',
  'charcoal',
  'terracotta',
  'deep_red',
  'grey',
  'slate',
  'natural_wood',
  'weathered_wood',
  'cement_grey',
  'concrete',
  'brick_red',
  'stone_grey',
  'sandstone',
  'gravel',
  'grass',
  'straw',
  'glass',
  'clear',
] as const;
export type RoofSwatch = (typeof ROOF_SWATCHES)[number];

export function isRoofSwatch(name: string): name is RoofSwatch {
  return (ROOF_SWATCHES as readonly string[]).includes(name);
}

/** How the ridge and the hips of a sloped roof of this look are covered. */
export type LookCap = 'round' | 'folded';

/**
 * What a design's flat roofs of a photo type wear: the sky photo, or their material — for a photo
 * older than the roof, or too blurred to show it.
 */
export const FLAT_ROOF_WEARS = ['photo', 'material'] as const;
export type FlatRoofWear = (typeof FLAT_ROOF_WEARS)[number];

/** What one roof of the scene is made of, as the 3D model draws it. */
export interface RoofSkin {
  readonly family: LookFamily;
  /** A flat roof of a type the photo shows true: where the photo covers it, it wears the photo. */
  readonly photo: boolean;
  /** Its colour where there is no photo. */
  readonly start: RoofSwatch;
  /** The colour a person picked, when this look is sold in it; else `null`, the system's. */
  readonly swatch: RoofSwatch | null;
}
