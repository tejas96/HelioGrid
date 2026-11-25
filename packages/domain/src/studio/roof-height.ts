import type { ProvenanceTier } from '../format/qualified';
import type { Roof, StudioDocument } from './document';
import { type EditResult, roofAt, withRoof } from './roof-check';
import { tierOf } from './roof-kind';
import type { RoofHeight, ValueSetter } from './roof-parts';

/**
 * A roof's height (`T-M05-002`, part b): the system sets it, a person may change it — by the blue
 * arrow in 3D or the sheet's slider — and a reset hands it back (*Values*). Until the height map is
 * read (part g) the system's value is the market pack's storey height, assumed (`F8-02`); a height a
 * person sets is estimated.
 */

/**
 * The sheet's slider runs from a low shed to a tall house; a taller building's runs on to two
 * floors above its roof, up to a tower's 60 m. A height past its ends is typed.
 */
export const ROOF_HEIGHT_SLIDER_MIN_M = 2;
export const ROOF_HEIGHT_SLIDER_MAX_M = 20;
export const ROOF_HEIGHT_SLIDER_TOP_M = 60;
/** The floors a slider reaches above the roof, so a building's next floor is a slide away. */
const SLIDER_FLOORS_ABOVE = 2;
/** One step of the slider and of the arrow: 10 cm. */
export const ROOF_HEIGHT_STEP_M = 0.1;
/** A typed height stands between a low wall and a tall tower. */
export const ROOF_HEIGHT_MIN_M = 0.3;
export const ROOF_HEIGHT_MAX_M = 300;

/** A height held to the centimetre, so the stored value is the one shown. */
const toCentimetre = (metres: number) => Math.round(metres * 100) / 100;

/** The height slider's ends and its step. */
export interface RoofHeightSlide {
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/**
 * The slider for a roof that stands at `standsM`: 2 to 20 m, or to the floor two above it where
 * that is higher, never past 60 m. The stored height sets it, never the one in hand, so the ends
 * stay still while the thumb moves.
 */
export function roofHeightSlide(
  standsM: number,
  floors: { readonly plinthHeightM: number; readonly storeyHeightM: number },
): RoofHeightSlide {
  const { plinthHeightM: plinth, storeyHeightM: storey } = floors;
  const reach =
    storey > 0
      ? plinth + storey * Math.ceil((standsM + storey * SLIDER_FLOORS_ABOVE - plinth) / storey)
      : standsM;
  const top = Math.min(ROOF_HEIGHT_SLIDER_TOP_M, Math.max(ROOF_HEIGHT_SLIDER_MAX_M, reach));
  // The top sits on the slider's 10 cm grid, so the end can be reached and the top floor is on it.
  const steps = Math.ceil(
    toCentimetre((top - ROOF_HEIGHT_SLIDER_MIN_M) / ROOF_HEIGHT_STEP_M) - 1e-9,
  );
  const max = toCentimetre(ROOF_HEIGHT_SLIDER_MIN_M + steps * ROOF_HEIGHT_STEP_M);
  return { min: ROOF_HEIGHT_SLIDER_MIN_M, max, step: ROOF_HEIGHT_STEP_M };
}

export interface RoofHeightShown {
  readonly metres: number;
  readonly setBy: ValueSetter;
  readonly tier: ProvenanceTier;
}

/**
 * The height a roof on the ground starts at where none is set: the market's plinth and one storey.
 * Every reader of a roof's first height takes it from here.
 */
export function groundRoofHeightM(market: {
  readonly storeyHeightM: number;
  readonly roof: { readonly plinthHeightM: number };
}): number {
  return market.roof.plinthHeightM + market.storeyHeightM;
}

/**
 * The height a roof stands at: its own, or `startHeightM` when none is set — for a roof on the
 * ground, `groundRoofHeightM`.
 */
export function roofHeightOf(roof: Roof, startHeightM: number): RoofHeightShown {
  const height: RoofHeight = roof.height ?? { metres: startHeightM, setBy: 'system' };
  return { metres: height.metres, setBy: height.setBy, tier: tierOf(height) };
}

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
 * One step up or down, by the arrow's keys: a whole step, kept on the slider's track — or, from a
 * height typed past an end, kept within what can be typed.
 */
export function roofHeightStepped(metres: number, by: 1 | -1, slide: RoofHeightSlide): number {
  return roofHeightDragged(metres, by * ROOF_HEIGHT_STEP_M, slide);
}

/**
 * The height in hand, kept: the design with it, why it is refused, or `null` when there is
 * nothing to keep — none in hand, or one within half a step of the height the roof stands at
 * (the slider let go where it was, rounded to its step).
 */
export function roofHeightKept(
  document: StudioDocument,
  index: number,
  inHand: number | null,
  startHeightM: number,
): EditResult | null {
  const roof = document.roofs[index];
  if (inHand === null || roof === undefined) return null;
  const standing = roofHeightOf(roof, startHeightM).metres;
  // In whole centimetres, as heights are kept: 3.05 against 3 is a change, 3.04 is not.
  if (Math.round(Math.abs(inHand - standing) * 100) < Math.round((ROOF_HEIGHT_STEP_M / 2) * 100)) {
    return null;
  }
  return roofHeightSet(document, index, inHand);
}

/**
 * Where the blue arrow puts the height while it is dragged: the height it was grabbed at plus how
 * far the pointer rose, in whole steps, kept on the slider's track. Grabbed past an end — a tower
 * typed at 70 m — it is kept within what can be typed instead, so a nudge never drops it onto the
 * track.
 */
export function roofHeightDragged(
  grabbedAt: number,
  risenM: number,
  slide: RoofHeightSlide,
): number {
  const steps = Math.round((grabbedAt + risenM) / ROOF_HEIGHT_STEP_M);
  const metres = toCentimetre(steps * ROOF_HEIGHT_STEP_M);
  const low = grabbedAt < slide.min ? ROOF_HEIGHT_MIN_M : slide.min;
  const high = grabbedAt > slide.max ? ROOF_HEIGHT_MAX_M : slide.max;
  return Math.min(high, Math.max(low, metres));
}
