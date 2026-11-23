/**
 * What a roof is made of (`T-M05-002`, part e): never its shape. The list lives here, so every
 * country sees every type; a market pack only orders them, and their names are the studio's words
 * in each language. A material picks how panels are fixed on it, and gives a new roof its first
 * shape, slope and parapet. A carport, water and a wall are surfaces, never materials.
 */

/** The groups the picker shows the materials in, in this order. */
export const ROOF_MATERIAL_GROUPS = [
  'concrete',
  'metal',
  'tiles',
  'cement_sheets',
  'covers',
  'raised_frame_only',
  'not_for_panels',
  'other',
] as const;
export type RoofMaterialGroup = (typeof ROOF_MATERIAL_GROUPS)[number];

/**
 * How panels are fixed on a roof: the mounting family. `other` roofs are fixed like one of the
 * first five, which a person picks; whether it is anchored, ballast or a raised frame is the
 * Panels step's choice.
 */
export const ROOF_FIXED_LIKE = ['concrete', 'metal', 'tile', 'cement', 'cover'] as const;
export type RoofFixedLike = (typeof ROOF_FIXED_LIKE)[number];

/** A roof's mounting family: one of the five, a raised frame alone, or no panels at all. */
export type RoofMounting = RoofFixedLike | 'raised_frame' | 'none';

/** The shapes a roof's top takes; the first five are the picker's tiles, the rest More shapes. */
export const ROOF_SHAPES = [
  'flat',
  'shed',
  'gable',
  'hip',
  'any',
  'sawtooth',
  'monitor',
  'curved',
  'butterfly',
  'mansard',
  'gambrel',
] as const;
export type RoofShape = (typeof ROOF_SHAPES)[number];

/** How many of the shapes are the picker's first tiles: Flat, Shed, Gable, Hip and Any shape. */
const ROOF_SHAPES_FIRST = 5;

const FIRST_SHAPES: readonly RoofShape[] = ROOF_SHAPES.slice(0, ROOF_SHAPES_FIRST);
const LATER_SHAPES: readonly RoofShape[] = ROOF_SHAPES.slice(ROOF_SHAPES_FIRST);

/** The shape picker's first tiles, the rest behind More shapes, and whether `now` is among the rest. */
export function shapePickOf(now: RoofShape) {
  return { first: FIRST_SHAPES, later: LATER_SHAPES, isLater: LATER_SHAPES.includes(now) };
}

interface MaterialFacts {
  readonly group: RoofMaterialGroup;
  /** Its mounting family; `null` for `other`, whose family a person picks. */
  readonly mounting: RoofMounting | null;
  /** Breaks under a foot: its own mark, apart from whether panels may go on it. */
  readonly fragile: boolean;
  /** The shape a new roof of it starts with. */
  readonly firstShape: RoofShape;
  /** Its first slope when sloped, in degrees, where the market pack names none. */
  readonly slopeDeg: number;
  /** A flat roof of it starts with a parapet all round. */
  readonly parapet: boolean;
  /** Under 5° it may be read as flat; a sheet or tile roof keeps its slope however low. */
  readonly canBeFlat: boolean;
}

const concrete = (firstShape: RoofShape, slopeDeg: number): MaterialFacts => ({
  group: 'concrete',
  mounting: 'concrete',
  fragile: false,
  firstShape,
  slopeDeg,
  parapet: true,
  canBeFlat: true,
});
const sloped = (
  group: RoofMaterialGroup,
  mounting: RoofMounting,
  slopeDeg: number,
  fragile = false,
): MaterialFacts => ({
  group,
  mounting,
  fragile,
  firstShape: 'gable',
  slopeDeg,
  parapet: false,
  canBeFlat: false,
});
const flatCover = (group: RoofMaterialGroup, mounting: RoofMounting): MaterialFacts => ({
  group,
  mounting,
  fragile: false,
  firstShape: 'flat',
  slopeDeg: 0,
  parapet: false,
  canBeFlat: true,
});

/** A metal sheet's usual slope: about 1 in 10. */
const SHEET_SLOPE_DEG = 6;
/** A cement sheet's least slope for rain to run off its laps. */
const CEMENT_SHEET_SLOPE_DEG = 10;
const TILE_SLOPE_DEG = 25;
const STEEP_TILE_SLOPE_DEG = 30;

/** Every roof material, in the order the picker's groups list them. */
const FACTS = {
  rcc: concrete('flat', 0),
  tiles_on_rcc: { ...concrete('gable', 20), parapet: false },
  brick_terrace: concrete('flat', 0),
  stone_slab: concrete('flat', 0),
  trapezoidal_sheet: sloped('metal', 'metal', SHEET_SLOPE_DEG),
  corrugated_gi: sloped('metal', 'metal', SHEET_SLOPE_DEG),
  standing_seam: sloped('metal', 'metal', SHEET_SLOPE_DEG),
  puf_panel: sloped('metal', 'metal', SHEET_SLOPE_DEG),
  stone_coated_metal_tile: sloped('metal', 'metal', 15),
  clay_tile: sloped('tiles', 'tile', TILE_SLOPE_DEG, true),
  country_tile: sloped('tiles', 'tile', STEEP_TILE_SLOPE_DEG, true),
  concrete_tile: sloped('tiles', 'tile', 22),
  slate: sloped('tiles', 'tile', STEEP_TILE_SLOPE_DEG, true),
  wood_shake: sloped('tiles', 'tile', STEEP_TILE_SLOPE_DEG),
  ac_sheet: sloped('cement_sheets', 'cement', CEMENT_SHEET_SLOPE_DEG, true),
  fibre_cement: sloped('cement_sheets', 'cement', CEMENT_SHEET_SLOPE_DEG, true),
  asphalt_shingle: sloped('covers', 'cover', 18),
  membrane: flatCover('covers', 'cover'),
  gravel_built_up: flatCover('covers', 'cover'),
  roof_garden: { ...flatCover('raised_frame_only', 'raised_frame'), parapet: true },
  glass: sloped('not_for_panels', 'none', CEMENT_SHEET_SLOPE_DEG, true),
  skylight_polycarbonate: sloped('not_for_panels', 'none', CEMENT_SHEET_SLOPE_DEG, true),
  thatch: sloped('not_for_panels', 'none', 40, true),
  other: { ...flatCover('other', 'cover'), mounting: null },
} as const satisfies Record<string, MaterialFacts>;

export type RoofMaterial = keyof typeof FACTS;
export const ROOF_MATERIALS: readonly RoofMaterial[] = Object.keys(FACTS) as RoofMaterial[];

/** The material a roof starts as where nothing says more: reinforced concrete. */
export const ROOF_MATERIAL_START: RoofMaterial = 'rcc';

export function isRoofMaterial(name: string): name is RoofMaterial {
  return Object.hasOwn(FACTS, name);
}

/**
 * A stored material name as this build reads it: a name from a later build is kept in the
 * document and read here as `other`, so the roof still draws and still saves.
 */
export function roofMaterialOf(name: string): RoofMaterial {
  return isRoofMaterial(name) ? name : 'other';
}

export function materialGroup(material: RoofMaterial): RoofMaterialGroup {
  return FACTS[material].group;
}

export function materialFragile(material: RoofMaterial): boolean {
  return FACTS[material].fragile;
}

/** Whether panels may go on it at all: glass, a skylight and thatch take none. */
export function materialTakesPanels(material: RoofMaterial): boolean {
  return FACTS[material].mounting !== 'none';
}

/**
 * How panels are fixed on a roof of this material. `other` follows what a person picked it is
 * fixed like, and a cover's way until they pick.
 */
export function materialMounting(
  material: RoofMaterial,
  fixedLike: RoofFixedLike | null,
): RoofMounting {
  return FACTS[material].mounting ?? fixedLike ?? 'cover';
}

/** The materials of one group, in the list's order. */
export function materialsIn(group: RoofMaterialGroup): readonly RoofMaterial[] {
  return ROOF_MATERIALS.filter((material) => FACTS[material].group === group);
}

/** What a market pack says of the materials: their order, and a first slope for some. */
export interface MaterialMarketFacts {
  /** Material names in the market's order; a name this build does not know is passed over. */
  readonly materialOrder: readonly string[];
  /** A first slope in degrees by material name, where the market's differs from the list's. */
  readonly firstSlopeDeg: Readonly<Record<string, number>>;
}

/**
 * Every material in the market's order: the pack's names first, as it lists them, then the rest
 * in the list's own order, so a pack that names few — or none — still offers every type.
 */
export function materialsOrdered(market: MaterialMarketFacts): readonly RoofMaterial[] {
  const first = market.materialOrder.filter(isRoofMaterial);
  const named = new Set<RoofMaterial>(first);
  return [...named, ...ROOF_MATERIALS.filter((material) => !named.has(material))];
}

/** How many materials the picker shows as its first tiles; All types opens the rest. */
export const ROOF_MATERIALS_FIRST = 5;

/** The market's first sheet type, which an open shed starts as. */
export function firstSheetMaterial(market: MaterialMarketFacts): RoofMaterial {
  const sheet = materialsOrdered(market).find((material) => {
    const { group } = FACTS[material];
    return group === 'metal' || group === 'cement_sheets';
  });
  return sheet ?? 'trapezoidal_sheet';
}

/** What a material gives a new roof: its first shape, slope and whether a parapet runs all round. */
export interface MaterialStart {
  readonly shape: RoofShape;
  /** Degrees; 0 for a flat roof. */
  readonly slopeDeg: number;
  readonly parapet: boolean;
}

/** A material's first slope when its roof is sloped: the market's, else the list's. */
export function materialSlopeDeg(material: RoofMaterial, market: MaterialMarketFacts): number {
  return market.firstSlopeDeg[material] ?? FACTS[material].slopeDeg;
}

/**
 * The first shape, slope and parapet of a roof of this material. A parapet stands only on a flat
 * roof: a sloped roof starts with none, whatever it is made of.
 */
export function materialStart(material: RoofMaterial, market: MaterialMarketFacts): MaterialStart {
  const { firstShape, parapet } = FACTS[material];
  const flat = firstShape === 'flat';
  return {
    shape: firstShape,
    slopeDeg: flat ? 0 : materialSlopeDeg(material, market),
    parapet: flat && parapet,
  };
}

/** Whether a roof of this material read under 5° is flat; a sheet or tile roof keeps its slope. */
export function materialCanBeFlat(material: RoofMaterial): boolean {
  return FACTS[material].canBeFlat;
}

/**
 * What a host knows of the site's roof before any design: a flat concrete roof, a metal shed or a
 * tiled roof. The studio names no record of a host's; the host turns its own word into one of these.
 */
export const SITE_ROOF_HINTS = ['concrete_flat', 'metal_shed', 'tile'] as const;
export type SiteRoofHint = (typeof SITE_ROOF_HINTS)[number];

const HINTED: Record<SiteRoofHint, RoofMaterial> = {
  concrete_flat: 'rcc',
  metal_shed: 'trapezoidal_sheet',
  tile: 'clay_tile',
};

/** The first roof's material: what the host knows of the site's roof, else concrete. */
export function materialForSite(hint: SiteRoofHint | null): RoofMaterial {
  return hint === null ? ROOF_MATERIAL_START : HINTED[hint];
}
