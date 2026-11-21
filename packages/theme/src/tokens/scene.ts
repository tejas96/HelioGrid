/**
 * The studio's daylight scene and the marks drawn on its picture (`T-M05-002`): the sky's light,
 * the ground's light and the walls' plaster; a corner's white, a tag's shade and a refusal's red.
 * Daylight and a photograph are the same whatever the page's mode, so each holds one value in every
 * palette; only the roof's line (`scene-line`) steps brighter in dark, beside the dark glass.
 */
export const DAYLIGHT = {
  'scene-sky': '#DDE8F2',
  'scene-ground': '#8C8574',
  'scene-wall': '#E9E3D8',
  'scene-mark': '#FFFFFF',
  'scene-shade': '#14181D',
  'scene-bad': '#C4432C',
} as const;
