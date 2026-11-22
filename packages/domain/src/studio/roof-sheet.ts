import type { ProvenanceTier } from '../format/qualified';
import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import {
  ROOF_HEIGHT_SLIDER_MAX_M,
  ROOF_HEIGHT_SLIDER_MIN_M,
  ROOF_HEIGHT_STEP_M,
  type RoofHeightShown,
  roofHeightOf,
} from './roof-height';
import { pointInside, roofArea } from './roof-shape';
import { roofAreaTier, scaleTierOf } from './roof-trust';

/**
 * A roof's sheet in 3D (`T-M05-002`, part b): a tap on a roof opens it with the roof's area and
 * height; the height is changed by the blue arrow, the slider or a typed box, and reset to the
 * system's. A reader's sheet shows the same values with no control.
 */

export interface RoofSheetView {
  readonly roof: number;
  /** The roof's area, square metres, and its tier. */
  readonly area: number;
  readonly areaTier: ProvenanceTier;
  /** The height as it stands now, the one in hand included. */
  readonly height: RoofHeightShown;
  /** The system's height, which Reset brings back and the slider marks. */
  readonly systemMetres: number;
  /** The slider's ends and step. */
  readonly slide: { readonly min: number; readonly max: number; readonly step: number };
}

/** The sheet of roof `index`, its height in hand shown; `null` when there is no such roof. */
export function roofSheetOf(
  document: StudioDocument,
  index: number,
  storeyHeightM: number,
  inHand: number | null,
): RoofSheetView | null {
  const roof = document.roofs[index];
  if (roof === undefined) return null;
  const stands = roofHeightOf(roof, storeyHeightM);
  return {
    roof: index,
    area: roofArea(roof.corners),
    areaTier: roofAreaTier(roof, scaleTierOf(document)),
    height: inHand === null ? stands : { metres: inHand, setBy: 'person', tier: 'estimated' },
    systemMetres: storeyHeightM,
    slide: {
      min: ROOF_HEIGHT_SLIDER_MIN_M,
      max: ROOF_HEIGHT_SLIDER_MAX_M,
      step: ROOF_HEIGHT_STEP_M,
    },
  };
}

/**
 * The roof a 3D tap lands on: each roof is tried at the height it stands at now (`heights`, a
 * height in hand included), the tallest first, since it stands in front. `groundAt` answers where
 * the tap meets a level that high; `null` off every roof.
 */
export function roofHitAt(
  document: StudioDocument,
  heights: readonly number[],
  groundAt: (heightM: number) => GroundPoint | null,
): number | null {
  const byHeight = document.roofs
    .map((roof, index) => ({ roof, index, metres: heights[index] ?? 0 }))
    .sort((a, b) => b.metres - a.metres);
  for (const { roof, index, metres } of byHeight) {
    const at = groundAt(metres);
    if (at !== null && pointInside(at, roof.corners)) return index;
  }
  return null;
}
