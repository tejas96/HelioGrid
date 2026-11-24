import { compassOf } from './compass';
import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofSlopeDeg } from './roof-built';
import {
  faceSidesOnOutline,
  type HandFaceClosed,
  type HandFaceRows,
  handFaceRefusal,
  handFacesCover,
  handFacesKept,
} from './roof-hand-faces';
import type { RoofFacts } from './roof-levels';
import type { HandFaceSet } from './roof-parts';
import { edgeLengths } from './roof-shape';
import { bearingsApart, equatorBearing, sideBearing, sideToward } from './roof-slope-way';
import { roofNumberOf } from './roof-values';

/**
 * A face drawn by hand stands on its roof (`T-M05-002`, part e, E082, board 5.10): it starts with
 * the roof's slope and a low side the studio picks, and a person may set either. Each is one
 * change to the design.
 */

/** Two sides this near in length are as long as each other: the one toward the equator wins. */
const ALIKE_SHARE = 0.05;

/**
 * The side a closed face slopes down to, where no person has said: the longest of its sides along
 * the roof's outline, as an eave is, and of two alike the one that looks toward the equator; with
 * none along the outline, the side that looks most toward the equator, as a shed's does.
 */
export function handFaceLowSideOf(
  outline: readonly GroundPoint[],
  corners: readonly GroundPoint[],
  latitude: number,
): number {
  const toward = equatorBearing(latitude);
  const along = faceSidesOnOutline(outline, corners);
  if (along.length === 0) return sideToward(corners, toward);
  const lengths = edgeLengths(corners);
  const longest = Math.max(...along.map((side) => lengths[side] ?? 0));
  const alike = along.filter((side) => (lengths[side] ?? 0) >= longest * (1 - ALIKE_SHARE));
  return alike.reduce((best, side) =>
    bearingsApart(sideBearing(corners, side), toward) <
    bearingsApart(sideBearing(corners, best), toward) - 1e-9
      ? side
      : best,
  );
}

/** The design with roof `index`'s faces changed; a roof with none stored is left as it is. */
function withFaces(
  document: StudioDocument,
  index: number,
  change: (faces: readonly HandFaceSet[]) => readonly HandFaceSet[],
): StudioDocument {
  const roof = document.roofs[index];
  if (roof?.shape === undefined) return document;
  const shape = { ...roof.shape, faces: change(handFacesKept(roof)) };
  return {
    ...document,
    roofs: document.roofs.map((each, i) => (i === index ? { ...roof, shape } : each)),
  };
}

/**
 * A face closed on roof `index`: it stands with the roof's slope, which the roof's Slope row still
 * moves, and the low side the studio picks. Faces left stale by an outline changed since are gone.
 */
export function handFaceClosed(
  document: StudioDocument,
  index: number,
  corners: readonly GroundPoint[],
  facts: RoofFacts,
  latitude: number,
): HandFaceClosed {
  const roof = document.roofs[index];
  if (roof?.shape === undefined) return { kind: 'refused', refusal: 'outside_roof' };
  const refusal = handFaceRefusal(roof, corners);
  if (refusal !== null) return { kind: 'refused', refusal };
  const face: HandFaceSet = {
    corners,
    slope: { degrees: roofSlopeDeg(roof, facts), setBy: 'system' },
    lowSide: handFaceLowSideOf(roof.corners, corners, latitude),
  };
  const faces = [...handFacesKept(roof), face];
  return {
    kind: 'made',
    document: withFaces(document, index, () => faces),
    whole: handFacesCover(roof.corners, faces),
  };
}

/**
 * A person sets one face's slope; `undefined` is its reset, and the face follows the roof's slope
 * again.
 */
export function handFaceSlopeSet(
  document: StudioDocument,
  index: number,
  face: number,
  degrees: number | undefined,
  facts: RoofFacts,
): StudioDocument {
  const roof = document.roofs[index];
  if (roof === undefined) return document;
  const slope =
    degrees === undefined
      ? { degrees: roofSlopeDeg(roof, facts), setBy: 'system' as const }
      : { degrees, setBy: 'person' as const };
  return withFaces(document, index, (faces) =>
    faces.map((each, at) => (at === face ? { ...each, slope } : each)),
  );
}

/** A person picks the side a face slopes down to. */
export function handFaceLowSet(
  document: StudioDocument,
  index: number,
  face: number,
  side: number,
): StudioDocument {
  return withFaces(document, index, (faces) =>
    faces.map((each, at) =>
      at === face && side >= 0 && side < each.corners.length ? { ...each, lowSide: side } : each,
    ),
  );
}

export function handFaceRowsOf(
  document: StudioDocument,
  index: number,
  face: number,
  facts: RoofFacts,
): HandFaceRows | null {
  const roof = document.roofs[index];
  const held = roof === undefined ? undefined : handFacesKept(roof)[face];
  const slope = roofNumberOf(document, { roof: index, key: 'slope', face }, facts);
  if (held === undefined || slope === null) return null;
  const sides = held.corners.map((_, side) => {
    const bearing = Math.round(sideBearing(held.corners, side)) % 360;
    return { side, faces: compassOf(bearing), bearing };
  });
  return { roof: index, face, slope, sides, low: held.lowSide };
}

/** Draw again: every face of roof `index` goes, as one change, and its faces are drawn anew. */
export function handFacesCleared(document: StudioDocument, index: number): StudioDocument {
  const roof = document.roofs[index];
  if (roof?.shape?.faces === undefined) return document;
  const { faces: _gone, ...shape } = roof.shape;
  return {
    ...document,
    roofs: document.roofs.map((each, i) => (i === index ? { ...roof, shape } : each)),
  };
}
