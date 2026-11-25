import type { CompassWay } from './compass';
import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { RoofNumberShown } from './roof-numbers';
import { type HandFaceSet, ROOF_HAND_FACES_MAX } from './roof-parts';
import {
  cornerAfter,
  distanceToSegment,
  edgeLengths,
  innerPoint,
  pointInside,
  roofArea,
  segmentsCross,
} from './roof-shape';
import { ringTargets, type SnapTargets } from './roof-snap';

/**
 * The faces a person draws on a roof of any shape (`T-M05-002`, part e, E082, board 5.10), as far
 * as the outline alone decides them: whether they still sit on it, whether they cover it, where a
 * new face may not go, and what its corners pull to. What a closed face starts with — its slope and
 * its low side — is the kernel's (`roof-hand-face-set.ts`).
 */

/**
 * How near the outline a face's corner may sit, in metres: kept to the centimetre, an edge's ends
 * and a corner along it each round on their own, up to a centimetre's diagonal apart. The faces
 * may miss a band a centimetre wide along the outline, and no more.
 */
const FIT_M = 0.01;
const ON_EDGE_M = FIT_M * Math.SQRT2;

/** A point on the ring's edge, within what rounding to the centimetre moves it. */
const onEdgeOf = (ring: readonly GroundPoint[], point: GroundPoint) =>
  ring.some((a, i) => distanceToSegment(point, a, cornerAfter(ring, i)) <= ON_EDGE_M);

/** A point inside the ring or on its edge. */
const onOrIn = (ring: readonly GroundPoint[], point: GroundPoint) =>
  pointInside(point, ring) || onEdgeOf(ring, point);

/** A point well inside the ring: inside it and clear of its edge. */
const deepIn = (ring: readonly GroundPoint[], point: GroundPoint) =>
  pointInside(point, ring) && !onEdgeOf(ring, point);

/** The middles of a ring's edges. */
const middlesOf = (ring: readonly GroundPoint[]) =>
  ring.map((a, i) => {
    const b = cornerAfter(ring, i);
    return { east: (a.east + b.east) / 2, north: (a.north + b.north) / 2 };
  });

/** An edge of one ring runs across an edge of the other, past where rounding could put it. */
function edgesRunAcross(one: readonly GroundPoint[], other: readonly GroundPoint[]): boolean {
  return one.some((a, i) => {
    const b = cornerAfter(one, i);
    return other.some((c, j) => {
      const d = cornerAfter(other, j);
      if (!segmentsCross(a, b, c, d)) return false;
      // A crossing within rounding of an end is a corner set on the other's edge: they touch.
      return [a, b].every((end) => distanceToSegment(end, c, d) > ON_EDGE_M);
    });
  });
}

/** Faces drawn by hand still sit on the outline they were drawn on: every corner on it or inside. */
export function handFacesOn(
  outline: readonly GroundPoint[],
  faces: readonly HandFaceSet[],
): boolean {
  return faces.every((face) => face.corners.every((corner) => onOrIn(outline, corner)));
}

/**
 * The faces cover the outline: together their area is the outline's, within the centimetre band,
 * and they leave no hole — each corner of the outline is on a face, and each corner of a face is
 * on the outline or on another face. A gap left inside, or a corner of the roof no face reaches,
 * is ground still to draw.
 */
export function handFacesCover(
  outline: readonly GroundPoint[],
  faces: readonly HandFaceSet[],
): boolean {
  const covered = faces.reduce((sum, face) => sum + roofArea(face.corners), 0);
  const around = edgeLengths(outline).reduce((sum, each) => sum + each, 0);
  if (Math.abs(covered - roofArea(outline)) > around * FIT_M) return false;
  const onSomeFace = (point: GroundPoint, except: number) =>
    faces.some((face, i) => i !== except && onEdgeOf(face.corners, point));
  return (
    outline.every((corner) => onSomeFace(corner, -1)) &&
    faces.every((face, i) =>
      face.corners.every((corner) => onEdgeOf(outline, corner) || onSomeFace(corner, i)),
    )
  );
}

/**
 * The faces a roof keeps: those it stores while they sit on its outline. An outline changed since
 * they were drawn — a corner moved, added or taken away, a length set, a plan resized, by this app
 * or by an older one that keeps faces it does not read — leaves them stale: none is kept, and the
 * next face drawn starts the roof's faces again.
 */
export function handFacesKept(roof: Roof): readonly HandFaceSet[] {
  const stored = roof.shape?.faces ?? [];
  return handFacesOn(roof.corners, stored) ? stored : [];
}

/** How far a roof's faces are drawn: none, some of the roof, or all of it. */
export type HandFacesDrawn = 'none' | 'part' | 'whole';

export function handFacesDrawn(roof: Roof): HandFacesDrawn {
  const kept = handFacesKept(roof);
  if (kept.length === 0) return 'none';
  return handFacesCover(roof.corners, kept) ? 'whole' : 'part';
}

/** Why a face cannot close where it is drawn. */
export type HandFaceRefusal = 'outside_roof' | 'over_face' | 'too_many_faces';

/** A face closed: the design with it standing on its roof, or why it may not stand. */
export type HandFaceClosed =
  | {
      readonly kind: 'made';
      readonly document: StudioDocument;
      /** The faces now cover the roof: it stands in them, and drawing ends. */
      readonly whole: boolean;
    }
  | { readonly kind: 'refused'; readonly refusal: HandFaceRefusal };

/** A corner of a face being drawn may not leave its roof. */
export function cornerOffRoof(roof: Roof, corner: GroundPoint): boolean {
  return !onOrIn(roof.corners, corner);
}

/** Whether two faces lie over each other: they may share an edge or a corner, never ground. */
function facesOverlap(one: readonly GroundPoint[], other: readonly GroundPoint[]): boolean {
  if (edgesRunAcross(one, other)) return true;
  const samples = (ring: readonly GroundPoint[]) => [...ring, ...middlesOf(ring), innerPoint(ring)];
  return (
    samples(one).some((point) => deepIn(other, point)) ||
    samples(other).some((point) => deepIn(one, point))
  );
}

/**
 * Why a face closed with these corners may not stand on the roof: it leaves the outline, it lies
 * over a face drawn before, or the roof holds its most faces; `null` when it may.
 */
export function handFaceRefusal(
  roof: Roof,
  corners: readonly GroundPoint[],
): HandFaceRefusal | null {
  const kept = handFacesKept(roof);
  if (kept.length >= ROOF_HAND_FACES_MAX) return 'too_many_faces';
  const outline = roof.corners;
  const leaves =
    [...corners, ...middlesOf(corners)].some((point) => !onOrIn(outline, point)) ||
    edgesRunAcross(corners, outline);
  if (leaves) return 'outside_roof';
  return kept.some((face) => facesOverlap(corners, face.corners)) ? 'over_face' : null;
}

/**
 * What a face's corner pulls to while it is drawn: the roof's own corners and edges, then the
 * corners and edges of the faces kept on it.
 */
export function handFaceTargets(roof: Roof, index: number): SnapTargets {
  const own = { kind: 'roof', roof: index } as const;
  const rings = [
    { ring: roof.corners, owner: own },
    ...handFacesKept(roof).map((face, at) => ({
      ring: face.corners,
      owner: { kind: 'face', roof: index, face: at } as const,
    })),
  ];
  return ringTargets(rings);
}

/** The sides of a face that lie along the roof's outline: where rain can leave the roof. */
export function faceSidesOnOutline(
  outline: readonly GroundPoint[],
  corners: readonly GroundPoint[],
): number[] {
  return corners.flatMap((from, side) => {
    const to = cornerAfter(corners, side);
    const middle = { east: (from.east + to.east) / 2, north: (from.north + to.north) / 2 };
    return [from, middle, to].every((point) => onEdgeOf(outline, point)) ? [side] : [];
  });
}

/**
 * The face drawn by hand a point lies on, on a roof that stands in its faces; `null` on any other
 * roof, or off every face.
 */
export function handFaceAt(
  document: StudioDocument,
  index: number,
  point: GroundPoint,
): number | null {
  const roof = document.roofs[index];
  if (roof === undefined || roof.shape?.is !== 'any' || handFacesDrawn(roof) !== 'whole') {
    return null;
  }
  const found = handFacesKept(roof).findIndex((face) => onOrIn(face.corners, point));
  return found < 0 ? null : found;
}

/** One face's own sheet, opened by a tap on it in 3D: its slope, and the side it slopes down to. */
export interface HandFaceRows {
  readonly roof: number;
  readonly face: number;
  /** Its slope, which follows the roof's until a person sets it; its reset brings the roof's back. */
  readonly slope: RoofNumberShown;
  /** Each of its sides, by the way it looks out, in whole degrees clockwise from north. */
  readonly sides: readonly {
    readonly side: number;
    readonly faces: CompassWay;
    readonly bearing: number;
  }[];
  /** The side it slopes down to now. */
  readonly low: number;
}
