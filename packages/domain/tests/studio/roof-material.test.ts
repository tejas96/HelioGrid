import { describe, expect, it } from 'vitest';
import { IN_ROOF_FACTS, ROOF_FACTS_DEFAULT } from '../../src/format/roof-facts';
import {
  firstSheetMaterial,
  materialCanBeFlat,
  materialForSite,
  materialFragile,
  materialGroup,
  materialMounting,
  materialSlopeDeg,
  materialStart,
  materialsIn,
  materialsOrdered,
  materialTakesPanels,
  ROOF_MATERIAL_GROUPS,
  ROOF_MATERIALS,
  ROOF_MATERIALS_FIRST,
  type RoofMaterial,
  roofMaterialOf,
} from '../../src/studio/roof-material';

/**
 * What a roof is made of (`T-M05-002`, part e): the list lives in the code, a market pack only
 * orders it, and each type knows its group, whether it breaks under a foot, how panels are fixed
 * on it and what it gives a new roof.
 */
const NONE = ROOF_FACTS_DEFAULT;

describe('the roof materials', () => {
  it.each([
    ['concrete', ['rcc', 'tiles_on_rcc', 'brick_terrace', 'stone_slab']],
    [
      'metal',
      [
        'trapezoidal_sheet',
        'corrugated_gi',
        'standing_seam',
        'puf_panel',
        'stone_coated_metal_tile',
      ],
    ],
    ['tiles', ['clay_tile', 'country_tile', 'concrete_tile', 'slate', 'wood_shake']],
    ['cement_sheets', ['ac_sheet', 'fibre_cement']],
    ['covers', ['asphalt_shingle', 'membrane', 'gravel_built_up']],
    ['raised_frame_only', ['roof_garden']],
    ['not_for_panels', ['glass', 'skylight_polycarbonate', 'thatch']],
    ['other', ['other']],
  ] as const)('the %s group holds its types, in the task’s order', (group, types) => {
    expect(materialsIn(group)).toEqual(types);
  });

  it('every type is in exactly one group', () => {
    const grouped = ROOF_MATERIAL_GROUPS.flatMap((group) => materialsIn(group));
    expect([...grouped].sort()).toEqual([...ROOF_MATERIALS].sort());
    expect(ROOF_MATERIALS.every((type) => materialsIn(materialGroup(type)).includes(type))).toBe(
      true,
    );
  });

  it('fragile is its own mark: exactly the types that break under a foot', () => {
    expect(ROOF_MATERIALS.filter(materialFragile)).toEqual([
      'clay_tile',
      'country_tile',
      'slate',
      'ac_sheet',
      'fibre_cement',
      'glass',
      'skylight_polycarbonate',
      'thatch',
    ]);
  });

  it('glass, a skylight and thatch take no panels; a fragile sheet or tile still does', () => {
    expect(ROOF_MATERIALS.filter((type) => !materialTakesPanels(type))).toEqual([
      'glass',
      'skylight_polycarbonate',
      'thatch',
    ]);
  });

  it.each([
    ['rcc', null, 'concrete'],
    ['puf_panel', null, 'metal'],
    ['slate', null, 'tile'],
    ['ac_sheet', null, 'cement'],
    ['membrane', null, 'cover'],
    ['roof_garden', null, 'raised_frame'],
    ['glass', null, 'none'],
    // A type's own family holds whatever was picked for another roof.
    ['rcc', 'metal', 'concrete'],
    ['other', 'metal', 'metal'],
    ['other', 'tile', 'tile'],
    // Until a person picks what it is fixed like, a cover's way.
    ['other', null, 'cover'],
  ] as const)('%s, fixed like %s, mounts as %s', (type, fixedLike, mounting) => {
    expect(materialMounting(type, fixedLike)).toBe(mounting);
  });

  it.each([
    ['rcc', { shape: 'flat', slopeDeg: 0, parapet: true }],
    ['brick_terrace', { shape: 'flat', slopeDeg: 0, parapet: true }],
    // Sloped concrete under tiles: a slope, and so no parapet.
    ['tiles_on_rcc', { shape: 'gable', slopeDeg: 20, parapet: false }],
    ['trapezoidal_sheet', { shape: 'gable', slopeDeg: 6, parapet: false }],
    ['clay_tile', { shape: 'gable', slopeDeg: 25, parapet: false }],
    ['ac_sheet', { shape: 'gable', slopeDeg: 10, parapet: false }],
    ['membrane', { shape: 'flat', slopeDeg: 0, parapet: false }],
    ['roof_garden', { shape: 'flat', slopeDeg: 0, parapet: true }],
    ['other', { shape: 'flat', slopeDeg: 0, parapet: false }],
  ] as const)('%s gives a new roof its first shape, slope and parapet', (type, start) => {
    expect(materialStart(type, NONE)).toEqual(start);
  });

  it('a sloped roof starts with no parapet, whatever it is made of', () => {
    const sloped = ROOF_MATERIALS.filter((type) => materialStart(type, NONE).shape !== 'flat');
    expect(sloped.some((type) => materialStart(type, NONE).parapet)).toBe(false);
  });

  it('the market’s first slope for a type wins over the list’s; a type it does not name keeps the list’s', () => {
    const market = { ...NONE, firstSlopeDeg: { trapezoidal_sheet: 9, bamboo_mat: 30 } };
    expect(materialSlopeDeg('trapezoidal_sheet', market)).toBe(9);
    expect(materialStart('trapezoidal_sheet', market).slopeDeg).toBe(9);
    expect(materialSlopeDeg('corrugated_gi', market)).toBe(6);
    // A flat roof stays flat whatever slope a pack names for its type.
    expect(materialStart('rcc', { ...NONE, firstSlopeDeg: { rcc: 5 } }).slopeDeg).toBe(0);
  });

  it.each([
    ['rcc', true],
    ['membrane', true],
    ['gravel_built_up', true],
    ['trapezoidal_sheet', false],
    ['clay_tile', false],
  ] as const)('%s read under 5° may be flat: %s', (type, flat) => {
    expect(materialCanBeFlat(type)).toBe(flat);
  });

  it('a market orders the types: its names first, then every other type in the list’s order', () => {
    const ordered = materialsOrdered(IN_ROOF_FACTS);
    expect(ordered.slice(0, ROOF_MATERIALS_FIRST)).toEqual([
      'rcc',
      'trapezoidal_sheet',
      'ac_sheet',
      'clay_tile',
      'puf_panel',
    ]);
    expect([...ordered].sort()).toEqual([...ROOF_MATERIALS].sort());
    expect(ordered).toHaveLength(ROOF_MATERIALS.length);
  });

  it('a pack that names no type, a type twice or one the studio does not know still offers every type once', () => {
    expect(materialsOrdered(NONE)).toEqual(ROOF_MATERIALS);
    const odd = { ...NONE, materialOrder: ['slate', 'bamboo_mat', 'slate', 'rcc'] };
    expect(materialsOrdered(odd).slice(0, 3)).toEqual(['slate', 'rcc', 'tiles_on_rcc']);
    expect(materialsOrdered(odd)).toHaveLength(ROOF_MATERIALS.length);
  });

  it.each([
    ['India’s order: the trapezoidal sheet', IN_ROOF_FACTS.materialOrder, 'trapezoidal_sheet'],
    ['a market that meets the AC sheet first', ['rcc', 'ac_sheet', 'puf_panel'], 'ac_sheet'],
    ['a pack that names no sheet: the list’s first', ['rcc', 'clay_tile'], 'trapezoidal_sheet'],
    ['a pack that names nothing', [], 'trapezoidal_sheet'],
  ] as const)(
    'an open shed starts as the market’s first sheet type — %s',
    (_why, materialOrder, sheet) => {
      expect(firstSheetMaterial({ ...NONE, materialOrder })).toBe(sheet);
    },
  );

  it.each([
    ['concrete_flat', 'rcc'],
    ['metal_shed', 'trapezoidal_sheet'],
    ['tile', 'clay_tile'],
    [null, 'rcc'],
  ] as const)('a site known as %s starts its first roof as %s', (hint, type) => {
    expect(materialForSite(hint)).toBe(type);
  });

  it.each([
    ['a type this build knows', 'slate', 'slate'],
    ['a type a later studio added', 'bamboo_mat', 'other'],
    ['an object’s own word, which is no type', 'constructor', 'other'],
  ] as const)('a stored material that is %s reads as it should', (_why, stored, type) => {
    expect(roofMaterialOf(stored)).toBe<RoofMaterial>(type);
  });
});
