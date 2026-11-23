import type { StudioDocument } from './document';
import { roofBuilt } from './roof-built';
import type { FormedRoof } from './roof-forms';
import { roofKindOf } from './roof-kind';
import { type RoofFacts, roofShapeNow, roofSloped } from './roof-levels';
import type { RoofShape } from './roof-material';
import { type EdgeStretch, edgesOf } from './roof-open-edges';
import { lowSideOf } from './roof-slope-way';

/**
 * What the kernel works out once for a design (`T-M05-002`, part e) and every picture of it then
 * reads — the 3D model, the top view's marks: each roof's sides split where another roof takes
 * them, and each sloped roof's faces.
 */
export interface RoofsWorked {
  /** Each roof's sides, each side's stretches. */
  readonly edges: readonly (readonly (readonly EdgeStretch[])[])[];
  /** Each sloped roof's faces and standing walls; `null` for a flat roof and for a hole. */
  readonly built: readonly (FormedRoof | null)[];
}

/** The shapes whose slope runs one way from a side: the studio picks that side where no one has. */
const ONE_WAY: readonly RoofShape[] = ['shed', 'sawtooth', 'monitor', 'curved', 'butterfly'];

/** `latitude`: the site's, which says which way a one-way slope first faces. */
export function roofsWorked(document: StudioDocument, facts: RoofFacts, latitude = 0): RoofsWorked {
  return {
    edges: document.roofs.map((_, index) => edgesOf(document, index, facts)),
    built: document.roofs.map((roof, index) => {
      if (roofKindOf(roof) === 'hole' || !roofSloped(roof, facts)) return null;
      const oneWay = ONE_WAY.includes(roofShapeNow(roof, facts));
      const side = oneWay ? lowSideOf(document, index, facts, latitude).side : undefined;
      return roofBuilt(roof, facts, side);
    }),
  };
}
