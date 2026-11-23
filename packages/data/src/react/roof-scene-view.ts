import {
  NO_ROOF_SCENE,
  type RoofFacts,
  type RoofSheetView,
  type StudioDocument,
} from '@heliogrid/domain';
import {
  heightPullOf,
  roofSceneOf,
  roofsAreaM2,
  roofsWorked,
  roofTopMarksOf,
  type WorkedBefore,
} from '@heliogrid/domain/studio-kernel';
import type { RoofModelShown } from './roof-model-shown';

/**
 * What the kernel worked out of the design last drawn: the next one reuses every roof's answers an
 * edit did not touch, so a corner dragged on a site of 200 roofs works out a handful of them.
 */
export interface RoofMemory {
  before?: WorkedBefore;
}

const NOTHING: RoofModelShown = { scene: NO_ROOF_SCENE, topMarks: [], roofsAreaM2: 0 };

/**
 * The design as it stands, or the preview of what is in hand, with the open sheet's height where
 * it is in hand (`T-M05-002`, part e). The kernel splits each side and builds each sloped roof
 * once, and the 3D model and the top view's marks both read that.
 */
export function roofModelShown(
  document: StudioDocument | null,
  facts: RoofFacts,
  sheet: RoofSheetView | null,
  /** The site's pin: its latitude says which way a one-way slope first faces. */
  pin: { readonly latitude: number } | null,
  memory: RoofMemory,
): RoofModelShown {
  if (document === null) return NOTHING;
  const roofs =
    sheet === null
      ? document.roofs
      : document.roofs.map((roof, index) =>
          index === sheet.roof
            ? { ...roof, height: { metres: sheet.height.metres, setBy: sheet.height.setBy } }
            : roof,
        );
  const shown = { ...document, roofs };
  const worked = roofsWorked(shown, facts, pin?.latitude ?? 0, memory.before);
  memory.before = { document: shown, worked };
  return {
    scene: roofSceneOf(shown, facts, worked),
    topMarks: roofTopMarksOf(shown, facts, worked),
    roofsAreaM2: roofsAreaM2(shown),
  };
}

/** The magnet for a dragged height: the kernel's pull while the magnet is on, none while it is off. */
export function heightPullWith(facts: RoofFacts, magnetOn: () => boolean) {
  return (design: StudioDocument, roof: number, metres: number, reachM: number) =>
    magnetOn() ? heightPullOf(design, roof, facts, metres, reachM) : null;
}
