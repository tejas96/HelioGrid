import type { ProvenanceTier } from '../format/qualified';
import type { Roof, StudioDocument, ValueSetter } from './document';
import { type EditResult, roofAt, withRoof } from './roof-check';

/**
 * A roof's height (`T-M05-002`, part b): the system sets it, a person may change it — by the blue
 * arrow in 3D or the sheet's slider — and a reset hands it back (*Values*). Until the height map is
 * read (part g) the system's value is the market pack's storey height, assumed (`F8-02`); a height a
 * person sets is estimated.
 */

/** The sheet's slider runs from a low shed to a tall house; a height past its ends is typed. */
export const ROOF_HEIGHT_SLIDER_MIN_M = 2;
export const ROOF_HEIGHT_SLIDER_MAX_M = 20;
/** One step of the slider and of the arrow: 10 cm. */
export const ROOF_HEIGHT_STEP_M = 0.1;
/** A typed height stands between a low wall and a tall tower. */
export const ROOF_HEIGHT_MIN_M = 0.3;
export const ROOF_HEIGHT_MAX_M = 300;

export interface RoofHeightShown {
  readonly metres: number;
  readonly setBy: ValueSetter;
  readonly tier: ProvenanceTier;
}

const TIER_OF: Record<ValueSetter, ProvenanceTier> = { system: 'assumed', person: 'estimated' };

/** The height a roof stands at: its own, or the market's storey height when none is set. */
export function roofHeightOf(roof: Roof, storeyHeightM: number): RoofHeightShown {
  const height = roof.height ?? { metres: storeyHeightM, setBy: 'system' };
  return { ...height, tier: TIER_OF[height.setBy] };
}

/** A height held to the centimetre, so the stored value is the one shown. */
const toCentimetre = (metres: number) => Math.round(metres * 100) / 100;

/** A person sets the roof's height: typed, slid or dragged. */
export function roofHeightSet(document: StudioDocument, index: number, metres: number): EditResult {
  if (!Number.isFinite(metres) || metres < ROOF_HEIGHT_MIN_M) {
    return { kind: 'refused', refusal: 'too_short' };
  }
  if (metres > ROOF_HEIGHT_MAX_M) return { kind: 'refused', refusal: 'too_long' };
  const roof = roofAt(document, index);
  const height = { metres: toCentimetre(metres), setBy: 'person' } as const;
  return { kind: 'done', document: withRoof(document, index, { ...roof, height }) };
}

/** The reset: the system's height comes back. */
export function roofHeightReset(document: StudioDocument, index: number): StudioDocument {
  return withRoof(document, index, { ...roofAt(document, index), height: null });
}

/**
 * Where the blue arrow puts the height while it is dragged: the height it was grabbed at plus how
 * far the pointer rose, in whole steps, kept on the slider's track. A height typed past the track
 * moves back onto it only when the arrow moves.
 */
export function roofHeightDragged(grabbedAt: number, risenM: number): number {
  const steps = Math.round((grabbedAt + risenM) / ROOF_HEIGHT_STEP_M);
  const metres = toCentimetre(steps * ROOF_HEIGHT_STEP_M);
  return Math.min(ROOF_HEIGHT_SLIDER_MAX_M, Math.max(ROOF_HEIGHT_SLIDER_MIN_M, metres));
}
