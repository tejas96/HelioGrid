import type { StudioDocument } from './document';
import type { GroundBox, GroundPoint } from './ground';
import {
  type RoofHeightShown,
  type RoofHeightSlide,
  roofHeightOf,
  roofHeightSlide,
} from './roof-height';
import { roofKindOf } from './roof-kind';
import type { RoofKind } from './roof-parts';
import { pointInside, roofArea, roofsBox } from './roof-shape';

/**
 * A roof's sheet in 3D (`T-M05-002`, part b): a tap on a roof opens it with the roof's area and
 * height; the height is changed by the blue arrow, the slider or a typed box, and reset to the
 * system's. A reader's sheet shows the same values with no control.
 */

export interface RoofSheetView {
  readonly roof: number;
  /** The roof's area, square metres. */
  readonly area: number;
  /** The height as it stands now, the one in hand included. */
  readonly height: RoofHeightShown;
  /** The system's height, which Reset brings back and the slider marks. */
  readonly systemMetres: number;
  /** The slider's ends and step: a house's, or one that reaches a taller building's roof. */
  readonly slide: RoofHeightSlide;
  /** The height is past the slider's ends: only the box can show it, and the switch rests on it. */
  readonly outside: boolean;
}

/** The sheet of roof `index`, its height in hand shown; `null` when there is no such roof. */
export function roofSheetOf(
  document: StudioDocument,
  index: number,
  startHeightM: number,
  inHand: number | null,
  floors: { readonly plinthHeightM: number; readonly storeyHeightM: number },
): RoofSheetView | null {
  const roof = document.roofs[index];
  if (roof === undefined) return null;
  const stands = roofHeightOf(roof, startHeightM);
  const height: RoofHeightShown =
    inHand === null ? stands : { metres: inHand, setBy: 'person', tier: 'estimated' };
  const slide = roofHeightSlide(stands.metres, floors);
  return {
    roof: index,
    area: roofArea(roof.corners),
    height,
    systemMetres: startHeightM,
    slide,
    outside: height.metres < slide.min || height.metres > slide.max,
  };
}

/** The kinds whose sheet has nothing to set in 3D. */
const NO_SHEET: readonly RoofKind[] = ['hole', 'dormer'];

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
  // A hole and a dormer have no height of their own to set: a tap on one lands on its roof.
  const byHeight = document.roofs
    .map((roof, index) => ({ roof, index, metres: heights[index] ?? 0 }))
    .filter(({ roof }) => !NO_SHEET.includes(roofKindOf(roof)))
    .sort((a, b) => b.metres - a.metres);
  for (const { roof, index, metres } of byHeight) {
    const at = groundAt(metres);
    if (at !== null && pointInside(at, roof.corners)) return index;
  }
  return null;
}

/** The roof whose sheet is open stands at the height in hand, and the camera frames it alone. */
export function roofsWithSheet(
  heights: readonly RoofHeightShown[],
  fit: GroundBox | null,
  roofSheet: RoofSheetView | null,
  document: StudioDocument | null,
): { heights: readonly RoofHeightShown[]; fit: GroundBox | null } {
  const open = roofSheet === null ? undefined : document?.roofs[roofSheet.roof];
  if (roofSheet === null || open === undefined) return { heights, fit };
  return {
    heights: heights.map((height, i) => (i === roofSheet.roof ? roofSheet.height : height)),
    fit: roofsBox([open]),
  };
}
