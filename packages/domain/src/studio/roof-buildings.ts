import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofFormOf } from './roof-built';
import { type EditRefusal, faultOf } from './roof-check';
import { roofHeightReset } from './roof-height';
import { belongsTo, roofWithItsParts, standsOn } from './roof-kind';
import type { RoofFacts } from './roof-levels';
import { roofPlaced, roofToCentimetre } from './roof-move';
import { distanceToSegment, roofsOverlap } from './roof-shape';
import type { RoofDataRead } from './site-heights';

/**
 * The drawn buildings LiDAR moves (`T-M05-002g`): roofs on the ground whose outlines touch, within
 * 30 cm, are one building — a tap or a chip picks it whole, and Match moves it by one shift, so its
 * roofs never tear apart along the edge they share. What stands on a roof, or is part of it, goes
 * with that roof.
 */

/** Roofs on the ground this close are one building. */
export const SAME_BUILDING_M = 0.3;
/** What a centimetre-kept corner may be off by: 30 cm apart on paper is 30 cm. */
const EDGE_SLACK_M = 1e-6;

export interface DrawnBuilding {
  /** Its roofs on the ground, by index, in the order they were drawn: the chip names them. */
  readonly roofs: readonly number[];
  /** Every roof that moves with it — those, and what stands on them or is part of them. */
  readonly members: readonly number[];
}

/** How far apart two outlines are at their nearest; 0 where they touch or overlap. */
export function outlinesApart(one: readonly GroundPoint[], other: readonly GroundPoint[]): number {
  if (roofsOverlap(one, other)) return 0;
  let nearest = Number.POSITIVE_INFINITY;
  for (const [points, ring] of [
    [one, other],
    [other, one],
  ] as const) {
    for (const point of points) {
      for (let i = 0; i < ring.length; i += 1) {
        const a = ring[i] as GroundPoint;
        const b = ring[(i + 1) % ring.length] as GroundPoint;
        nearest = Math.min(nearest, distanceToSegment(point, a, b));
      }
    }
  }
  return nearest;
}

const onTheGround = (document: StudioDocument, roof: Roof) =>
  standsOn(document, roof) === null && belongsTo(document, roof) === null;

/** The design's buildings, in the order of their first roof. */
export function buildingsOf(document: StudioDocument): readonly DrawnBuilding[] {
  const ground = document.roofs.flatMap((roof, i) => (onTheGround(document, roof) ? [i] : []));
  const up = new Map(ground.map((i) => [i, i]));
  const top = (i: number): number => {
    const parent = up.get(i) ?? i;
    if (parent === i) return i;
    const root = top(parent);
    up.set(i, root);
    return root;
  };
  ground.forEach((a, at) => {
    for (const b of ground.slice(at + 1)) {
      const one = document.roofs[a]?.corners ?? [];
      const other = document.roofs[b]?.corners ?? [];
      if (outlinesApart(one, other) <= SAME_BUILDING_M + EDGE_SLACK_M) up.set(top(b), top(a));
    }
  });
  const by = new Map<number, number[]>();
  for (const i of ground) by.set(top(i), [...(by.get(top(i)) ?? []), i]);
  return [...by.values()].map((roofs) => ({
    roofs,
    members: [...new Set(roofs.flatMap((i) => roofWithItsParts(document, i)))].sort(
      (a, b) => a - b,
    ),
  }));
}

/** The building a roof is part of; `null` for no roof of the design. */
export function buildingOfRoof(
  buildings: readonly DrawnBuilding[],
  roof: number,
): DrawnBuilding | null {
  return buildings.find((building) => building.members.includes(roof)) ?? null;
}

/** A roof's top is one height only when it is flat: a sloped one is a slope, never one number. */
export function roofIsFlat(roof: Roof, facts: RoofFacts): boolean {
  return roofFormOf(roof, facts).shape === 'flat';
}

/** Where the scan sees one building: the shift that puts it there, and its roofs' reads there. */
export interface BuildingScanFit {
  /** `null`: no shift does better than where it stands, or the scan sees it past the reach. */
  readonly shift: GroundPoint | null;
  /**
   * The scan sees the building farther off than the reach (`SCAN_REACH_M`): Match leaves it be,
   * since its reads where it stands are not of its building.
   */
  readonly beyondReach: boolean;
  /** What the scan reads in each of its roofs at that place (or where it stands), by roof id. */
  readonly reads: Readonly<Record<string, RoofDataRead>>;
  /** The scan's low and high in each of its roofs there, above its ground, by roof id. */
  readonly ranges: Readonly<Record<string, { readonly lowM: number; readonly highM: number }>>;
}

/**
 * Match the scan: each building moved by its shift as one piece, then each of its flat roofs the
 * scan reads hands its height back to the data (`withSiteHeights` sets it from the read at its new
 * place, less what it stands on). A sloped roof keeps its height: a slope is no one number.
 */
export function scanMatched(
  document: StudioDocument,
  matches: readonly { readonly building: DrawnBuilding; readonly fit: BuildingScanFit }[],
  facts: RoofFacts,
): StudioDocument {
  let working = document;
  // A building past the reach stays as it is: its reads where it stands are not of it.
  for (const { building, fit } of matches.filter((match) => !match.fit.beyondReach)) {
    if (fit.shift !== null) {
      const moved = roofsMoved(working, building.roofs, fit.shift);
      if (moved.fault === null) working = moved.document;
    }
    for (const index of building.members) {
      const roof = working.roofs[index];
      if (roof === undefined || !roofIsFlat(roof, facts)) continue;
      if (fit.reads[roof.id]?.kind === 'roof') working = roofHeightReset(working, index);
    }
  }
  return working;
}

/**
 * Back to as drawn: each of these roofs takes back its outline, its faces and its height as the
 * design opened; a roof drawn since keeps what it has. Every other value stays.
 */
export function roofsAsDrawn(
  document: StudioDocument,
  opening: StudioDocument,
  roofIds: readonly string[],
): StudioDocument {
  const roofs = document.roofs.map((roof) => {
    if (!roofIds.includes(roof.id)) return roof;
    const was = opening.roofs.find((one) => one.id === roof.id);
    if (was === undefined) return roof;
    const { shape: _shape, ...rest } = roof;
    return {
      ...rest,
      corners: was.corners,
      height: was.height,
      ...(was.shape === undefined ? {} : { shape: was.shape }),
    };
  });
  return roofs.every((roof, i) => roof === document.roofs[i]) ? document : { ...document, roofs };
}

/** Whether a roof stands somewhere other than as the design opened, or at another height. */
export function roofMovedSinceOpening(roof: Roof, opening: StudioDocument): boolean {
  const was = opening.roofs.find((one) => one.id === roof.id);
  if (was === undefined) return false;
  const moved = roof.corners.some((c, i) => {
    const w = was.corners[i];
    return (
      w === undefined || Math.abs(c.east - w.east) >= 0.01 || Math.abs(c.north - w.north) >= 0.01
    );
  });
  return (
    moved ||
    roof.corners.length !== was.corners.length ||
    roof.height?.metres !== was.height?.metres
  );
}

/**
 * Several roofs moved together by `by` metres east and north (LiDAR's Move, `T-M05-002g`): each with
 * what stands on it or is part of it, each carried once, kept to the centimetre — so a building's
 * roofs never tear apart along an edge they share. The first thing wrong with a moved roof comes
 * back with it.
 */
export function roofsMoved(
  document: StudioDocument,
  roofIndices: readonly number[],
  by: GroundPoint,
): { readonly document: StudioDocument; readonly fault: EditRefusal | null } {
  const going = new Set(roofIndices.flatMap((index) => roofWithItsParts(document, index)));
  const place = (c: GroundPoint) => ({ east: c.east + by.east, north: c.north + by.north });
  const roofs = document.roofs.map((roof, i) =>
    going.has(i) ? roofToCentimetre(roofPlaced(roof, place)) : roof,
  );
  const fault =
    [...going].map((i) => faultOf(roofs[i]?.corners ?? [])).find((one) => one !== null) ?? null;
  return { document: { ...document, roofs }, fault };
}

/**
 * The studio's magnet on a drag in LiDAR (`T-M05-002g`, step 7): picked roofs dragged within this
 * of where the scan sees their building are pulled onto it — the scan's edges are soft over about a
 * metre, so a nearer reach would never catch.
 */
export const SCAN_PULL_M = 1;

/**
 * A drag of `by` metres, with the magnet on, pulled onto `fit` (where the scan sees the building,
 * from where it stands) when it comes within reach: then it is on the scan.
 */
export function draggedOntoScan(
  by: GroundPoint,
  fit: GroundPoint | null,
  magnet: boolean,
): { readonly by: GroundPoint; readonly onScan: boolean } {
  if (!magnet || fit === null) return { by, onScan: false };
  const near = Math.hypot(by.east - fit.east, by.north - fit.north) <= SCAN_PULL_M;
  return near ? { by: fit, onScan: true } : { by, onScan: false };
}
