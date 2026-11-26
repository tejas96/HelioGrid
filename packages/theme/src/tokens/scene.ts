/**
 * The studio's daylight scene and the marks drawn on its picture (`T-M05-002`): the sky's light,
 * the ground's light and the walls' plaster; a corner's white, a tag's shade, a refusal's red and
 * the setback line's orange and the stairs' clear strip's green; the height view's and sunlight's
 * keys (part g).
 * Daylight and a photograph are the same whatever the page's mode, so each holds one value in every
 * palette; only the roof's line (`scene-line`) steps brighter in dark, beside the dark glass.
 */
/**
 * The colours a roof's material is sold in, as daylight shows them (`T-M05-002`, part e, roof
 * looks): a sheet's paint, a tile's clay, a slab's stone. Each lies under its material's pattern in
 * 3D; which material comes in which is domain's (`roof-look.ts`).
 */
export const ROOF_COLOURS = {
  'scene-roof-white': '#E9E9E4',
  'scene-roof-light_grey': '#C4C7C8',
  'scene-roof-galvanised': '#B8BFC3',
  'scene-roof-blue': '#3F6F9F',
  'scene-roof-green': '#4F7A57',
  'scene-roof-red': '#9A3A2C',
  'scene-roof-brown': '#6E4B36',
  'scene-roof-charcoal': '#4A5058',
  'scene-roof-terracotta': '#B9572F',
  'scene-roof-deep_red': '#8C3A28',
  'scene-roof-grey': '#7B7D80',
  'scene-roof-slate': '#4C535C',
  'scene-roof-natural_wood': '#8C6B4B',
  'scene-roof-weathered_wood': '#8A8478',
  'scene-roof-cement_grey': '#AEACA5',
  'scene-roof-concrete': '#CFCAC1',
  'scene-roof-brick_red': '#B7704F',
  'scene-roof-stone_grey': '#9FA29A',
  'scene-roof-sandstone': '#C9B48F',
  'scene-roof-gravel': '#B0AAA0',
  'scene-roof-grass': '#6F8F45',
  'scene-roof-straw': '#A68B5A',
  'scene-roof-glass': '#BCD6E2',
  'scene-roof-clear': '#E3EEF2',
} as const;

export const DAYLIGHT = {
  ...ROOF_COLOURS,
  'scene-sky': '#DDE8F2',
  'scene-ground': '#8C8574',
  'scene-wall': '#E9E3D8',
  'scene-mark': '#FFFFFF',
  'scene-shade': '#14181D',
  'scene-bad': '#C4432C',
  'scene-setback': '#FF8A2A',
  'scene-clear': '#2EB86E',
  // The height view's key (`T-M05-002`, part g, board G7): low to high. Art over the picture, never
  // words; each band is also named in metres on the key.
  'scene-height-1': '#2B5FD9',
  'scene-height-2': '#21A8A8',
  'scene-height-3': '#E8C547',
  'scene-height-4': '#E3572E',
  'scene-height-5': '#BF2652',
  // Sunlight's key (board G24): much shade to none, also named in per cent on the key.
  'scene-sun-1': '#2E1A6B',
  'scene-sun-2': '#C7387A',
  'scene-sun-3': '#FA8C26',
  'scene-sun-4': '#FFED73',
  // The sun bar (board G8): dark glass over the real sky with white words, the same in every mode
  // as the sky is; the picked day's gold with its dark ink; the day line's dawn-to-noon fill, the
  // sun's disc, sunset's dot.
  'scene-sun-glass': '#0C1016',
  'scene-sun-gold': '#FFB02E',
  'scene-sun-ink': '#1B1203',
  'scene-sun-dawn': '#FF8A3D',
  'scene-sun-noon': '#FFD36B',
  'scene-sun-disc': '#FFF3C4',
  'scene-sun-dusk': '#FF6A3D',
  // The sun chart's three days (board G10): lines, never words; each is named beside its line.
  'scene-day-june': '#F59E0B',
  'scene-day-march': '#10B5A5',
  'scene-day-december': '#6D7CFF',
} as const;

/** Every scene colour's name: daylight's, and the roof's line, which steps brighter in dark. */
export const SCENE_TOKENS = [
  ...(Object.keys(DAYLIGHT) as (keyof typeof DAYLIGHT)[]),
  'scene-line',
] as const;
