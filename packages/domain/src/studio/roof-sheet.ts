import type { StudioDocument } from './document';
import type { GroundBox } from './ground';
import {
  type RoofHeightShown,
  type RoofHeightSlide,
  roofHeightOf,
  roofHeightSlide,
} from './roof-height';
import { roofKindOf } from './roof-kind';
import { roofArea, roofsBox } from './roof-shape';

/**
 * A roof's sheet in 3D (`T-M05-002`, part b): a tap on a roof opens it with the roof's area and
 * height; the height is changed by the blue arrow, the slider or a typed box, and reset to the
 * system's. A reader's sheet shows the same values with no control.
 */

export interface RoofSheetView {
  readonly roof: number;
  /**
   * It has a height of its own to set. A hole has none: it is open down to the floor below, level
   * with the top of the roof it is cut in, so its sheet shows no height and no arrow.
   */
  readonly hasHeight: boolean;
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
    hasHeight: roofKindOf(roof) !== 'hole',
    area: roofArea(roof.corners),
    height,
    systemMetres: startHeightM,
    slide,
    outside: height.metres < slide.min || height.metres > slide.max,
  };
}

/**
 * The roof whose sheet is open stands at the height in hand, and the camera frames it alone,
 * looking at its top (`fitUpM`, above the ground): a duct or a stair room on a tall building is
 * framed where it is, not at the ground under it. With no sheet the camera looks at the ground.
 */
export function roofsWithSheet(
  heights: readonly RoofHeightShown[],
  fit: GroundBox | null,
  roofSheet: RoofSheetView | null,
  document: StudioDocument | null,
  /** Each roof's top above the ground, in the order of the design's roofs: the scene's levels. */
  tops: readonly { readonly topM: number }[],
): { heights: readonly RoofHeightShown[]; fit: GroundBox | null; fitUpM: number } {
  const open = roofSheet === null ? undefined : document?.roofs[roofSheet.roof];
  if (roofSheet === null || open === undefined) return { heights, fit, fitUpM: 0 };
  const own = roofSheet.hasHeight;
  return {
    heights: heights.map((height, i) => (own && i === roofSheet.roof ? roofSheet.height : height)),
    fit: roofsBox([open]),
    fitUpM: tops[roofSheet.roof]?.topM ?? 0,
  };
}
