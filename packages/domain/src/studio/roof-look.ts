import type { Roof } from './document';
import { roofMaterialNow } from './roof-levels';
import {
  type FlatRoofWear,
  isRoofSwatch,
  type LookCap,
  type LookFamily,
  type RoofSkin,
  type RoofSwatch,
} from './roof-look-kinds';
import { isRoofFixedLike, type RoofFixedLike, type RoofMaterial } from './roof-material';

/**
 * What a roof looks like in 3D (`T-M05-002`, part e, roof looks). A flat roof the sky photo shows
 * true — RCC, a brick terrace, a stone slab, a membrane, gravel, a roof garden — wears the photo;
 * every other roof wears its material's look: a pattern at its true size, running down each face,
 * in a colour the material is sold in. The colours themselves are the theme's (`scene-roof-*`);
 * this file holds which ones each look is sold in.
 */

interface FamilyFacts {
  /** How far its pattern runs before it repeats, along the eave and up the slope, in metres. */
  readonly repeatM: readonly [along: number, up: number];
  /** The colours it is sold in. */
  readonly swatches: readonly RoofSwatch[];
  readonly cap: LookCap | null;
  /** The ground and the sky show through it. */
  readonly seeThrough: boolean;
}

const SHEET_COLOURS: readonly RoofSwatch[] = [
  'white',
  'light_grey',
  'galvanised',
  'blue',
  'green',
  'red',
  'brown',
  'charcoal',
];
const TILE_COLOURS: readonly RoofSwatch[] = ['terracotta', 'deep_red', 'brown', 'grey', 'charcoal'];

const sheet = (repeatM: FamilyFacts['repeatM']): FamilyFacts => ({
  repeatM,
  swatches: SHEET_COLOURS,
  cap: 'folded',
  seeThrough: false,
});
const flat = (repeatM: number, swatches: readonly RoofSwatch[]): FamilyFacts => ({
  repeatM: [repeatM, repeatM],
  swatches,
  cap: null,
  seeThrough: false,
});

/** Each look's true size (as its maps were made: `.qa/board-looks/tex/looks.json`) and colours. */
const FAMILIES: Record<LookFamily, FamilyFacts> = {
  // Ribs 0.25 m apart, four to a metre.
  trapezoidal: sheet([1, 1]),
  // Ten 76 mm waves.
  corrugated: sheet([0.76, 1]),
  // Seven 146 mm waves.
  cement_sheet: {
    repeatM: [1.022, 1.2],
    swatches: ['cement_grey', 'white', 'red', 'green'],
    cap: 'folded',
    seeThrough: false,
  },
  // Seams 0.5 m apart.
  standing_seam: sheet([1, 1]),
  // Four tiles 0.21 m wide, three rows 0.33 m up: a Mangalore tile.
  tile: { repeatM: [0.84, 0.99], swatches: TILE_COLOURS, cap: 'round', seeThrough: false },
  slate: { repeatM: [1, 0.8], swatches: ['slate', 'charcoal'], cap: 'round', seeThrough: false },
  shingle: {
    repeatM: [1, 1],
    swatches: ['charcoal', 'brown', 'grey', 'deep_red', 'green'],
    cap: 'round',
    seeThrough: false,
  },
  shake: {
    repeatM: [1, 1],
    swatches: ['natural_wood', 'weathered_wood'],
    cap: 'round',
    seeThrough: false,
  },
  concrete: flat(4, ['concrete', 'white']),
  terrace_tile: flat(1.2, ['brick_red', 'terracotta', 'grey']),
  stone_slab: flat(1.2, ['stone_grey', 'sandstone']),
  membrane: flat(2, ['white', 'light_grey', 'charcoal']),
  gravel: flat(1, ['gravel']),
  grass: flat(2, ['grass']),
  thatch: { repeatM: [1, 1], swatches: ['straw'], cap: 'round', seeThrough: false },
  glass: { repeatM: [1.2, 0.6], swatches: ['glass'], cap: null, seeThrough: true },
  polycarbonate: { repeatM: [0.76, 1], swatches: ['clear'], cap: null, seeThrough: true },
};

interface MaterialLook {
  readonly family: LookFamily;
  /** Its colour where there is no photo to read one from. */
  readonly start: RoofSwatch;
  /** A flat roof of it is seen true from the sky: it wears the photo. */
  readonly photo: boolean;
}

const look = (family: LookFamily, start: RoofSwatch, photo = false): MaterialLook => ({
  family,
  start,
  photo,
});

/** Every material's look. */
const MATERIALS: Record<RoofMaterial, MaterialLook> = {
  rcc: look('concrete', 'concrete', true),
  tiles_on_rcc: look('tile', 'terracotta'),
  brick_terrace: look('terrace_tile', 'brick_red', true),
  stone_slab: look('stone_slab', 'stone_grey', true),
  trapezoidal_sheet: look('trapezoidal', 'blue'),
  corrugated_gi: look('corrugated', 'galvanised'),
  standing_seam: look('standing_seam', 'charcoal'),
  puf_panel: look('trapezoidal', 'white'),
  stone_coated_metal_tile: look('tile', 'deep_red'),
  clay_tile: look('tile', 'terracotta'),
  country_tile: look('tile', 'brown'),
  concrete_tile: look('tile', 'grey'),
  slate: look('slate', 'slate'),
  wood_shake: look('shake', 'natural_wood'),
  ac_sheet: look('cement_sheet', 'cement_grey'),
  fibre_cement: look('cement_sheet', 'cement_grey'),
  asphalt_shingle: look('shingle', 'charcoal'),
  membrane: look('membrane', 'white', true),
  gravel_built_up: look('gravel', 'gravel', true),
  roof_garden: look('grass', 'grass', true),
  glass: look('glass', 'glass'),
  skylight_polycarbonate: look('polycarbonate', 'clear'),
  thatch: look('thatch', 'straw'),
  // An `other` roof looks like what it is fixed like (`OTHER_LOOKS`), else a plain cover.
  other: look('membrane', 'light_grey'),
};

/** An `other` roof, by what it is fixed like. */
const OTHER_LOOKS: Record<RoofFixedLike, MaterialLook> = {
  concrete: MATERIALS.rcc,
  metal: MATERIALS.trapezoidal_sheet,
  tile: MATERIALS.clay_tile,
  cement: MATERIALS.ac_sheet,
  cover: MATERIALS.other,
};

/** The steepest face that still wears the photo: steeper, a sky photo has too few pixels for it. */
export const PHOTO_STEEPEST_DEG = 45;

export function familyFacts(family: LookFamily): FamilyFacts {
  return FAMILIES[family];
}

/**
 * A roof's look, from its material (an `other` roof's from what it is fixed like) and its colour.
 * A design whose flat roofs wear their material has no roof that wears the photo.
 */
export function roofSkinOf(roof: Roof, flatRoofs: FlatRoofWear = 'photo'): RoofSkin {
  const material = roofMaterialNow(roof);
  const fixedLike = roof.material?.fixedLike;
  const own =
    material === 'other' && fixedLike !== undefined && isRoofFixedLike(fixedLike)
      ? OTHER_LOOKS[fixedLike]
      : MATERIALS[material];
  const picked = roof.colour?.setBy === 'person' ? roof.colour.swatch : null;
  const sold =
    picked !== null && isRoofSwatch(picked) && FAMILIES[own.family].swatches.includes(picked);
  return {
    family: own.family,
    photo: own.photo && flatRoofs === 'photo',
    start: own.start,
    swatch: sold ? picked : null,
  };
}
