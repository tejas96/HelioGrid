import type { TranslatedText } from '@heliogrid/contracts';
import type {
  RoofFixedLike,
  RoofMaterial,
  RoofMaterialGroup,
  RoofName,
  RoofRow,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { roofNameWord } from './studio-roof-kinds';

type T = Translator['t'];

/**
 * Roofs, the one sheet that holds every roof, the button that opens it, and what a roof is made of
 * (`T-M05-002`, part e). The list of materials lives in the code, so every country sees every
 * type: their names are the studio's words in each language.
 */
const LIST = {
  head: /*i18n*/ {
    id: '{count, plural, one {# roof} other {# roofs}} · {area} of roof',
  },
  close: /*i18n*/ { id: 'Close Roofs' },
  roofs: /*i18n*/ { id: 'Roofs' },
  // The Roofs button, spoken with its count, and with what waits to be checked.
  roofsCount: /*i18n*/ { id: 'Roofs, {count}' },
  roofsWaiting: /*i18n*/ { id: 'Roofs, {count}, {waiting} to check' },
  waiting: /*i18n*/ { id: '{name}: to check' },
  sitsMain: /*i18n*/ { id: 'Main roof' },
  sitsGround: /*i18n*/ { id: 'On the ground' },
  sitsBeside: /*i18n*/ { id: 'Beside {roof}' },
  sitsAbove: /*i18n*/ { id: '{height} above {roof}' },
  sitsIn: /*i18n*/ { id: 'In {roof}' },
  sitsPartOf: /*i18n*/ { id: 'Part of {roof}' },
  copyRoof: /*i18n*/ { id: 'Copy {name}' },
  deleteRoof: /*i18n*/ { id: 'Delete {name}' },
  madeOf: /*i18n*/ { id: '{name} is made of {material}. Change it' },
  // The picker.
  pickerTitle: /*i18n*/ { id: 'What is it made of?' },
  pickerOther: /*i18n*/ { id: 'Other material' },
  pickerClose: /*i18n*/ { id: 'Close' },
  pickerLine: /*i18n*/ {
    id: 'It sets how panels are fixed, and the first shape, slope and parapet.',
  },
  allTypes: /*i18n*/ { id: 'All types' },
  firstTypes: /*i18n*/ { id: 'Back to the first types' },
  confirm: /*i18n*/ { id: 'Confirm {material}' },
  notOnList: /*i18n*/ { id: 'Not on the list' },
  otherName: /*i18n*/ { id: 'Its name' },
  fixedLike: /*i18n*/ { id: 'Fix panels on it like' },
  otherLine: /*i18n*/ { id: 'The name goes on the drawings.' },
  useOther: /*i18n*/ { id: 'Use {name}' },
  useIt: /*i18n*/ { id: 'Use it' },
  fragile: /*i18n*/ { id: '{material}, fragile' },
  // The bar's next step, after the roofs.
  nextObjects: /*i18n*/ { id: 'Add roof objects' },
} as const;

const MATERIAL: Record<RoofMaterial, { id: string }> = {
  rcc: /*i18n*/ { id: 'RCC' },
  tiles_on_rcc: /*i18n*/ { id: 'Tiles on RCC' },
  brick_terrace: /*i18n*/ { id: 'Brick or jack-arch terrace' },
  stone_slab: /*i18n*/ { id: 'Stone slab' },
  trapezoidal_sheet: /*i18n*/ { id: 'Trapezoidal sheet' },
  corrugated_gi: /*i18n*/ { id: 'Corrugated GI' },
  standing_seam: /*i18n*/ { id: 'Standing seam' },
  puf_panel: /*i18n*/ { id: 'PUF panel' },
  stone_coated_metal_tile: /*i18n*/ { id: 'Stone-coated metal tile' },
  clay_tile: /*i18n*/ { id: 'Mangalore tile' },
  country_tile: /*i18n*/ { id: 'Country half-round tile' },
  concrete_tile: /*i18n*/ { id: 'Concrete tile' },
  slate: /*i18n*/ { id: 'Slate' },
  wood_shake: /*i18n*/ { id: 'Wood shake' },
  ac_sheet: /*i18n*/ { id: 'AC sheet' },
  fibre_cement: /*i18n*/ { id: 'Fibre cement sheet' },
  asphalt_shingle: /*i18n*/ { id: 'Asphalt shingle' },
  membrane: /*i18n*/ { id: 'Membrane' },
  gravel_built_up: /*i18n*/ { id: 'Gravel built-up' },
  roof_garden: /*i18n*/ { id: 'Roof garden' },
  glass: /*i18n*/ { id: 'Glass' },
  skylight_polycarbonate: /*i18n*/ { id: 'Skylight or polycarbonate' },
  thatch: /*i18n*/ { id: 'Thatch or kutcha' },
  other: /*i18n*/ { id: 'Other' },
};

const GROUP = {
  concrete: /*i18n*/ { id: 'Concrete' },
  metal: /*i18n*/ { id: 'Metal' },
  tiles: /*i18n*/ { id: 'Tiles' },
  cement_sheets: /*i18n*/ { id: 'Cement sheets' },
  covers: /*i18n*/ { id: 'Covers' },
  raised_frame_only: /*i18n*/ { id: 'Raised frame only' },
  not_for_panels: /*i18n*/ { id: 'Not for panels' },
  other: /*i18n*/ { id: 'Other' },
} as const satisfies Record<RoofMaterialGroup, { id: string }>;

const FIXED: Record<RoofFixedLike, { id: string }> = {
  concrete: /*i18n*/ { id: 'Concrete' },
  metal: /*i18n*/ { id: 'Metal' },
  tile: /*i18n*/ { id: 'Tile' },
  cement: /*i18n*/ { id: 'Cement' },
  cover: /*i18n*/ { id: 'Cover' },
};

/** What a roof is made of, in words: the type's name, or the name a person typed for their own. */
function materialWord(t: T, material: NonNullable<RoofRow['material']>): TranslatedText {
  return material.name === null ? t(MATERIAL[material.type]) : (material.name as TranslatedText);
}

/** Where a roof sits, on its row: "Main roof", "3.0 m above Roof 1", "Beside Roof 1". */
function sitsWord(t: T, sits: RoofRow['sits'], height: (metres: number) => string): TranslatedText {
  switch (sits.kind) {
    case 'main':
      return t(LIST.sitsMain);
    case 'ground':
      return t(LIST.sitsGround);
    case 'beside':
      return t(LIST.sitsBeside, { roof: roofNameWord(t, sits.roof) });
    case 'above':
      return t(LIST.sitsAbove, { height: height(sits.metres), roof: roofNameWord(t, sits.roof) });
    case 'in':
      return t(LIST.sitsIn, { roof: roofNameWord(t, sits.roof) });
    case 'part_of':
      return t(LIST.sitsPartOf, { roof: roofNameWord(t, sits.roof) });
  }
}

/** The words of Roofs, its button and the material picker, part of the studio canvas's. */
export function studioRoofListWords(t: T) {
  return {
    /** "3 roofs · 81 m² of roof": the area already formatted. */
    roofsHead: (count: number, area: string) => t(LIST.head, { count, area }),
    roofsClose: t(LIST.close),
    roofsName: t(LIST.roofs),
    /** The Roofs button, spoken: its count, and how many roofs wait to be checked. */
    roofsCount: (count: number, waiting: number) =>
      waiting > 0 ? t(LIST.roofsWaiting, { count, waiting }) : t(LIST.roofsCount, { count }),
    rowName: (name: RoofName) => roofNameWord(t, name),
    /** A row whose material or kind waits, spoken with its name. */
    rowWaiting: (name: RoofName) => t(LIST.waiting, { name: roofNameWord(t, name) }),
    rowSits: (sits: RoofRow['sits'], height: (metres: number) => string) =>
      sitsWord(t, sits, height),
    rowMaterial: (material: NonNullable<RoofRow['material']>) => materialWord(t, material),
    rowCopy: (name: RoofName) => t(LIST.copyRoof, { name: roofNameWord(t, name) }),
    rowDelete: (name: RoofName) => t(LIST.deleteRoof, { name: roofNameWord(t, name) }),
    /** The material on a row, spoken: a tap opens the picker. */
    rowMadeOf: (name: RoofName, material: NonNullable<RoofRow['material']>) =>
      t(LIST.madeOf, { name: roofNameWord(t, name), material: materialWord(t, material) }),
    material: (type: RoofMaterial) => t(MATERIAL[type]),
    /** A fragile type, spoken: its picture carries the warning triangle. */
    materialFragile: (type: RoofMaterial) => t(LIST.fragile, { material: t(MATERIAL[type]) }),
    materialGroup: (group: RoofMaterialGroup) => t(GROUP[group]),
    fixedLike: (family: RoofFixedLike) => t(FIXED[family]),
    pickerTitle: t(LIST.pickerTitle),
    pickerOther: t(LIST.pickerOther),
    pickerClose: t(LIST.pickerClose),
    pickerLine: t(LIST.pickerLine),
    allTypes: t(LIST.allTypes),
    firstTypes: t(LIST.firstTypes),
    confirmMaterial: (type: RoofMaterial) => t(LIST.confirm, { material: t(MATERIAL[type]) }),
    notOnList: t(LIST.notOnList),
    otherName: t(LIST.otherName),
    fixedLikeTitle: t(LIST.fixedLike),
    otherLine: t(LIST.otherLine),
    /** "Use Kota stone", or "Use it" before a name is typed. */
    useOther: (name: string) => (name === '' ? t(LIST.useIt) : t(LIST.useOther, { name })),
    /** The bar's one act once a roof stands: on to the next step. */
    nextObjects: t(LIST.nextObjects),
  };
}
