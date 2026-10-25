/**
 * One round progress ring, drawn from the glyph set's `ring` (a circle of radius 9 about 12,12 in a
 * 24 box) scaled to the size asked for — so the ring stays a named shape and no mark is written by
 * hand. Both halves draw from this one sum; a ring drawn without it drifts from its twin.
 */
const GLYPH_RADIUS = 9;
const GLYPH_CENTRE = 12;

/** The ring as the board draws it: its square, its radius and its stroke, in px. */
export interface RingGeometry {
  box: number;
  radius: number;
  stroke: number;
}

/** `SCR-M01-17`'s run: 132px, r58, stroke 10. */
export const RUN_RING: RingGeometry = { box: 132, radius: 58, stroke: 10 };

/** `SCR-M01-17`'s share rings: 64px, r26, stroke 6. */
export const SHARE_RING: RingGeometry = { box: 64, radius: 26, stroke: 6 };

/** The arc starts at twelve o'clock — the web's `transform` on the arc's group. */
export const RING_TURN = `rotate(-90 ${GLYPH_CENTRE} ${GLYPH_CENTRE})`;

/** The same turn's pivot, as react-native-svg's `origin` spells it. */
export const RING_ORIGIN = `${GLYPH_CENTRE}, ${GLYPH_CENTRE}`;

export interface RingDrawing {
  /** The glyph's box cut so the ring fills `box` at `radius`. */
  viewBox: string;
  /** `stroke` in the glyph's units. */
  strokeWidth: number;
  /** The ring's length in the glyph's units — the dash. */
  circumference: number;
  /** How much of the dash is held back: the circumference × (1 − share). */
  offset: number;
}

/** The viewBox, stroke and dash that draw `share` (0–1, held to it) of the ring. */
export function ringDrawing({ box, radius, stroke }: RingGeometry, share: number): RingDrawing {
  const scale = radius / GLYPH_RADIUS;
  const side = box / scale;
  const origin = GLYPH_CENTRE - side / 2;
  const circumference = 2 * Math.PI * GLYPH_RADIUS;
  const held = Math.min(1, Math.max(0, share));
  return {
    viewBox: `${origin} ${origin} ${side} ${side}`,
    strokeWidth: stroke / scale,
    circumference,
    offset: circumference * (1 - held),
  };
}

/** How much of the run is done, 0–1; nothing to count is nothing done. */
export function doneShare(done: number, total: number): number {
  return total > 0 ? done / total : 0;
}
