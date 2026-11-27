import type { Roof, StudioDocument } from './document';
import { roofAreaM2, roofSurfaceM2, roofsAreaM2 } from './roof-free-ground';
import { belongsTo, roofKindOf, roofWithItsParts, standsOn } from './roof-kind';
import { type RoofFacts, roofMaterialNow, roofOwnHeightM } from './roof-levels';
import type { RoofList, RoofRow, RoofSits } from './roof-list';
import { roofNameOf } from './roof-names';
import { ringAreaM2 } from './roof-polygons';
import type { RoofsWorked } from './roof-worked';

/** The Roofs sheet's rows, from the design and what the kernel worked out of it. */

/** Two areas this close are one, in square metres: the shape library's own error is far less. */
const SAME_AREA_M2 = 0.01;

/** The roof a roof's row sits under: the one it stands on, else the one it is part of. */
function holderOf(document: StudioDocument, roof: Roof): number | null {
  return standsOn(document, roof) ?? belongsTo(document, roof);
}

/** Each roof's place in the list: a roof on the ground, then what sits on it, and on those. */
function inOrder(document: StudioDocument): { roof: number; child: boolean }[] {
  const holders = document.roofs.map((roof) => holderOf(document, roof));
  const out: { roof: number; child: boolean }[] = [];
  const seen = new Set<number>();
  const add = (roof: number, child: boolean) => {
    if (seen.has(roof)) return;
    seen.add(roof);
    out.push({ roof, child });
    holders.forEach((holder, other) => {
      if (holder === roof) add(other, true);
    });
  };
  holders.forEach((holder, roof) => {
    if (holder === null) add(roof, false);
  });
  // A ring of links from another studio holds no roof on the ground: its roofs still get a row.
  for (let roof = 0; roof < document.roofs.length; roof += 1) add(roof, false);
  return out;
}

function sitsOf(
  document: StudioDocument,
  facts: RoofFacts,
  worked: RoofsWorked,
  index: number,
): RoofSits {
  const roof = document.roofs[index] as Roof;
  const nameOf = (other: number) =>
    roofNameOf(document, other) ?? { kind: 'roof' as const, number: other + 1 };
  const holder = holderOf(document, roof);
  if (holder !== null) {
    const kind = roofKindOf(roof);
    if (kind === 'hole' || kind === 'dormer') return { kind: 'in', roof: nameOf(holder) };
    if (kind === 'separate_part') return { kind: 'part_of', roof: nameOf(holder) };
    const metres = roofOwnHeightM(document, roof, facts);
    return { kind: 'above', roof: nameOf(holder), metres };
  }
  // The first roof on the ground is the main roof, whatever it meets.
  const firstOnGround = document.roofs.findIndex((other) => holderOf(document, other) === null);
  if (index === firstOnGround) return { kind: 'main' };
  // What stands on the roof meets its edges too, and is not beside it.
  const own = roofWithItsParts(document, index);
  const met = (worked.edges[index] ?? [])
    .flat()
    .find((stretch) => stretch.other !== null && !own.includes(stretch.other));
  return met?.other == null ? { kind: 'ground' } : { kind: 'beside', roof: nameOf(met.other) };
}

function rowOf(
  document: StudioDocument,
  facts: RoofFacts,
  worked: RoofsWorked,
  index: number,
  child: boolean,
): RoofRow {
  const roof = document.roofs[index] as Roof;
  const kind = roofKindOf(roof);
  const hole = kind === 'hole';
  const confirmed = roof.material?.confirmed === true;
  // What the studio guessed a roof is waits until a person makes it theirs.
  const guessed = kind !== 'building' && roof.kind?.setBy !== 'person';
  const sloped = worked.built[index] != null;
  return {
    roof: index,
    kind,
    name: roofNameOf(document, index) ?? { kind: 'roof', number: index + 1 },
    sits: sitsOf(document, facts, worked, index),
    material: hole
      ? null
      : { type: roofMaterialNow(roof), name: roof.material?.name ?? null, confirmed },
    areaM2: hole
      ? ringAreaM2(roof.corners)
      : sloped
        ? roofSurfaceM2(document, index, facts)
        : roofAreaM2(document, index),
    child,
    waits: guessed || (!hole && !confirmed),
  };
}

export function roofListOf(
  document: StudioDocument,
  facts: RoofFacts,
  worked: RoofsWorked,
): RoofList {
  const rows = inOrder(document).map(({ roof, child }) =>
    rowOf(document, facts, worked, roof, child),
  );
  const areaM2 = roofsAreaM2(document);
  const roofRows = rows.filter((row) => row.kind !== 'hole');
  // Flat rows show their area from above: their sum is the whole only where none lies over another.
  const flat = roofRows.every((row) => worked.built[row.roof] == null);
  const sum = roofRows.reduce((total, row) => total + row.areaM2, 0);
  return {
    rows,
    count: roofRows.length,
    areaM2,
    rowsAddUp: roofRows.length > 0 && flat && Math.abs(sum - areaM2) < SAME_AREA_M2,
    waiting: rows.filter((row) => row.waits).length,
  };
}
