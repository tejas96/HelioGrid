import type { Roof, StudioDocument } from './document';
import { roofBuilt } from './roof-built';
import type { FormedRoof } from './roof-forms';
import { roofKindOf } from './roof-kind';
import { type RoofFacts, roofShapeNow, roofSloped, roofTopsM } from './roof-levels';
import type { RoofShape } from './roof-material';
import { type EdgeStretch, edgesOf } from './roof-open-edges';
import { farApart } from './roof-polygons';
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

/** A design and what was worked out of it: the next design reuses what an edit did not touch. */
export interface WorkedBefore {
  readonly document: StudioDocument;
  readonly worked: RoofsWorked;
}

/**
 * The roofs whose answers an edit can have changed: a roof that is not the same roof, one whose
 * top stands at another height, and every roof near one of those, where it stood or where it
 * stands now. A side is split by the roofs near it and by how high they stand, by nothing else.
 */
function touchedBy(
  document: StudioDocument,
  facts: RoofFacts,
  before: WorkedBefore,
): readonly boolean[] | null {
  const was = before.document;
  if (was.roofs.length !== document.roofs.length) return null;
  const tops = roofTopsM(document, facts);
  const topsWas = roofTopsM(was, facts);
  const moved = document.roofs.map(
    (roof, i) => roof !== was.roofs[i] || Math.abs((tops[i] ?? 0) - (topsWas[i] ?? 0)) > 0,
  );
  const changed = moved.flatMap((is, i) => (is ? [i] : []));
  return document.roofs.map((roof, i) => {
    if (moved[i]) return true;
    return changed.some((other) => {
      const now = document.roofs[other] as Roof;
      const then = was.roofs[other] as Roof;
      return !farApart(roof.corners, now.corners) || !farApart(roof.corners, then.corners);
    });
  });
}

/**
 * `latitude`: the site's, which says which way a one-way slope first faces. `before`: the design
 * as it last stood and what was worked out of it — a roof no edit touched keeps its answers, so a
 * corner dragged on a site of 200 roofs works out a handful of them, not all.
 */
export function roofsWorked(
  document: StudioDocument,
  facts: RoofFacts,
  latitude = 0,
  before?: WorkedBefore,
): RoofsWorked {
  const touched = before === undefined ? null : touchedBy(document, facts, before);
  const kept = (index: number) => touched !== null && touched[index] === false;
  return {
    edges: document.roofs.map((_, index) =>
      kept(index) ? (before?.worked.edges[index] ?? []) : edgesOf(document, index, facts),
    ),
    built: document.roofs.map((roof, index) => {
      if (kept(index)) return before?.worked.built[index] ?? null;
      if (roofKindOf(roof) === 'hole' || !roofSloped(roof, facts)) return null;
      const oneWay = ONE_WAY.includes(roofShapeNow(roof, facts));
      const side = oneWay ? lowSideOf(document, index, facts, latitude).side : undefined;
      return roofBuilt(roof, facts, side);
    }),
  };
}
