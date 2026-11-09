import { theme } from '@heliogrid/theme';

/**
 * TENANT-BRAND SWATCH DATA — the starting points an operator picks their OWN company's colour
 * from. They are not HelioGrid's visual values, so `@heliogrid/theme` does not hold them: a
 * tenant's blue is not something the design language has an opinion about.
 *
 * This file therefore holds raw colour, and is the ONE path the raw-colour plugin exempts — its
 * `!…/brand-swatches.ts` line in `biome.json`. It holds nothing but the data, so
 * every styling line in `BrandColorField` beside it stays covered. Both platform halves default
 * from here rather than each spelling the list, so the two pickers cannot offer different swatches.
 */
export const BRAND_SWATCH_PRESETS: string[] = [
  '#1F5FA9',
  '#0D7A4F',
  '#B3401F',
  '#6B3FA0',
  '#0A0A0B',
];

/**
 * The colour a tenant who has chosen nothing yet is shown. It IS the system accent, as a hex — the
 * field opens on our own colour, not on an invented one — so it reads the token rather than repeating
 * its value.
 */
export const DEFAULT_BRAND_COLOUR: string = theme.palettes.light.accent;

/**
 * The phone's colour grid — React Native has no system colour picker, so a tap on the hex field's
 * dot opens these. Ten hue families, each dark to light, row by row; the web opens the browser's
 * own picker instead. A brand hex outside them is still typed.
 */
export const BRAND_PICKER_COLOURS: string[] = [
  '#7F1D1D',
  '#9A3412',
  '#92400E',
  '#3F6212',
  '#065F46',
  '#115E59',
  '#1E3A8A',
  '#3730A3',
  '#6B21A8',
  '#9D174D',
  '#B91C1C',
  '#C2410C',
  '#B45309',
  '#4D7C0F',
  '#047857',
  '#0F766E',
  '#1D4ED8',
  '#4338CA',
  '#7E22CE',
  '#BE185D',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#84CC16',
  '#10B981',
  '#14B8A6',
  '#3B82F6',
  '#6366F1',
  '#A855F7',
  '#EC4899',
  '#111827',
  '#374151',
  '#4B5563',
  '#6B7280',
  '#9CA3AF',
  '#57534E',
  '#78716C',
  '#0C4A6E',
  '#164E63',
  '#134E4A',
];
