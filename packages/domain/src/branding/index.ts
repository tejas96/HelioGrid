/**
 * Tenant branding for customer documents and link pages (`F7-07`, `M01-50`): the one hex shape,
 * the WCAG maths and its two floors, and the contrast re-verification that makes a palette
 * measurable rather than refusable.
 */
export type { CompliantShades } from './compliant-shades';
export { compliantShades } from './compliant-shades';
export { contrastRatio, MARK_CONTRAST_FLOOR, TEXT_CONTRAST_FLOOR } from './contrast';
export type { Rgb } from './hex-colour';
export {
  HEX_COLOUR,
  hexToRgb,
  isHexColour,
  normaliseHexColour,
  parseHexColour,
  toHexColour,
} from './hex-colour';
