/**
 * WCAG 2.x contrast (`F7-11`, `N4`): relative luminance, the ratio between two colours, and the
 * two floors the product holds — words, and marks that carry meaning. Every measurement in the
 * product goes through here; `packages/theme` carries the same formula for its own build because
 * it imports nothing in the workspace (`M1`), so a change here is a change there.
 */
import { hexToRgb, type Rgb } from './hex-colour';

/** The floor for words: WCAG AA for body-size text, and this system's own rule. */
export const TEXT_CONTRAST_FLOOR = 4.5;
/** The floor for a meaning-bearing non-text mark — a rule, a bar, an icon. */
export const MARK_CONTRAST_FLOOR = 3;

function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast between two colours, 1 to 21; symmetric, so which is the text does not matter. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
