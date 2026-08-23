import { theme } from '@heliogrid/theme';

/**
 * TENANT-BRAND SWATCH DATA — the starting points an operator picks their OWN company's colour
 * from. They are not HelioGrid's visual values, so `@heliogrid/theme` cannot hold them: that
 * package is GENERATED from the live design system (`ds:pull`, docs/17 §6) and never
 * hand-transcribed, and a tenant's blue is not something the design system has an opinion about.
 *
 * This file therefore holds raw colour, and is the ONE path the raw-colour gate exempts — see the
 * `COLOUR_DATA_FILES` note in `scripts/check-adherence.sh`. It holds nothing but the data, so
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
 * The colour a tenant who has chosen nothing yet is shown. It IS the system accent — the field
 * opens on our own colour, not on an invented one — so it reads the token rather than repeating
 * its value.
 */
export const DEFAULT_BRAND_COLOUR: string = theme.colors.accent;
