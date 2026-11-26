import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import {
  LINE_UP_LIFT_MAX_M,
  LINE_UP_SHIFT_MAX_M,
  LINE_UP_STEP_M,
  type SiteLineUp,
} from './site-data';

/**
 * The height view (`T-M05-002`, part g, board group 3): Google's height map seen in 3D and flat
 * in the top view, coloured by height or by the sunlight each spot keeps, see-through; and the
 * person's line-up of the map under the picture.
 */

export const HEIGHT_VIEW_MODES = ['heights', 'sunlight'] as const;
export type HeightViewMode = (typeof HEIGHT_VIEW_MODES)[number];

export interface HeightView {
  readonly on: boolean;
  readonly mode: HeightViewMode;
  /** How much of the map shows, 0.1 to 1. */
  readonly seeThrough: number;
  /** Line up the map is open under the view. */
  readonly lining: boolean;
}

/** The view as it first opens: off; heights; a little more than half see-through (board G6). */
export const HEIGHT_VIEW_START: HeightView = {
  on: false,
  mode: 'heights',
  seeThrough: 0.62,
  lining: false,
};
/** The see-through slider's ends and step. */
export const SEE_THROUGH_MIN = 0.1;
export const SEE_THROUGH_MAX = 1;
export const SEE_THROUGH_STEP = 0.01;

/** The map shows fully this far from the roofs, and fades out over the next 10 m (board G7). */
export const HEIGHT_VIEW_NEAR_M = 15;
export const HEIGHT_VIEW_FADE_M = 10;

const NO_LINE_UP: SiteLineUp = { east: 0, north: 0, lift: 0 };
const toStep = (metres: number) => Math.round(metres / LINE_UP_STEP_M) * LINE_UP_STEP_M;
const clamp = (metres: number, max: number) => Math.max(-max, Math.min(max, toStep(metres)));

/** The line-up the design holds: none is the map where the studio laid it. */
export function lineUpOf(document: StudioDocument): SiteLineUp {
  return document.site?.lineUp ?? NO_LINE_UP;
}

/** A point of the map where the person's line-up moved it. */
export function linedUp<P extends GroundPoint>(point: P, lineUp: SiteLineUp): P {
  return { ...point, east: point.east + lineUp.east, north: point.north + lineUp.north };
}

/** The map lifted or lowered to `lift` metres, kept to its 10 cm steps and its ±3 m. */
export function lineUpLifted(document: StudioDocument, lift: number): StudioDocument {
  const now = lineUpOf(document);
  return withLineUp(document, { ...now, lift: clamp(lift, LINE_UP_LIFT_MAX_M) });
}

/**
 * The map moved one 10 cm step the way an arrow points on the screen: `way` is that arrow's way on
 * the ground, as the camera turns it, so the arrows read right in any view.
 */
export function lineUpNudged(document: StudioDocument, way: GroundPoint): StudioDocument {
  const now = lineUpOf(document);
  const reach = Math.hypot(way.east, way.north) || 1;
  return withLineUp(document, {
    ...now,
    east: clamp(now.east + (way.east / reach) * LINE_UP_STEP_M, LINE_UP_SHIFT_MAX_M),
    north: clamp(now.north + (way.north / reach) * LINE_UP_STEP_M, LINE_UP_SHIFT_MAX_M),
  });
}

/** Back to automatic: the line-up goes. */
export function lineUpCleared(document: StudioDocument): StudioDocument {
  if (document.site?.lineUp === undefined) return document;
  const { lineUp: _gone, ...site } = document.site;
  return { ...document, site };
}

function withLineUp(document: StudioDocument, lineUp: SiteLineUp): StudioDocument {
  const still = lineUp.east === 0 && lineUp.north === 0 && lineUp.lift === 0;
  if (still) return lineUpCleared(document);
  return { ...document, site: { ...document.site, lineUp } };
}

/** The key's two ends: the low and the high of the map near the roofs, in metres above the ground. */
export function heightKeyOf(heights: readonly number[]): { lowM: number; highM: number } | null {
  const known = heights.filter((h) => Number.isFinite(h)).sort((a, b) => a - b);
  if (known.length === 0) return null;
  const at = (share: number) => known[Math.round(share * (known.length - 1))] as number;
  // The lowest twentieth and the highest hundredth are left out: a pit, a mast.
  const lowM = Math.max(0, Math.floor(at(KEY_LOW_SHARE)));
  const highM = Math.max(lowM + 1, Math.ceil(at(KEY_HIGH_SHARE)));
  return { lowM, highM };
}

const KEY_LOW_SHARE = 0.05;
const KEY_HIGH_SHARE = 0.99;
