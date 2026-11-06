/**
 * The logo's colours: the globe runs green → teal → blue, the tagline is deep ocean. Used exactly in
 * gradients and marks; the interface colours in `colors.ts` derive from them with contrast measured.
 * The gradient is spent once per screen — a hero's top line, a progress fill, the brand mark.
 */
export const BRAND = {
  green: '#56BD39',
  teal: '#21998C',
  blue: '#0078B9',
  ocean: '#035A82',
} as const;

/** The logo gradient as stops, for the phone's SVG gradients and the web's `--gradient-brand`. */
export const BRAND_GRADIENT_STOPS = [
  { offset: 0, color: BRAND.green },
  { offset: 0.5, color: BRAND.teal },
  { offset: 1, color: BRAND.blue },
] as const;
