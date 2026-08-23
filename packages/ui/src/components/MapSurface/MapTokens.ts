/**
 * The web half's token vocabulary. These reach SVG presentation attributes, which a stylesheet
 * class cannot set when the value is chosen at render time — so they are custom properties,
 * never raw colours.
 */

export const MAP_ACCENT = 'var(--accent)';
export const MAP_INFO = 'var(--info)';
export const MAP_SURFACE = 'var(--surface)';

/** A pending pin is accent with a hollow core; a confirmed pin is a filled success pin. */
export const MAP_PIN_COLOR: Record<'pending' | 'confirmed', string> = {
  pending: 'var(--accent)',
  confirmed: 'var(--success)',
};
