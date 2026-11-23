import type { GroundPoint } from './ground';
import { outlineForFaces } from './roof-face-outline';
import {
  type BuiltFace,
  type BuiltRoof,
  type FaceEdge,
  facesFromSides,
  riseOf,
  type ShapedRing,
  type SideShape,
} from './roof-faces';
import type { RoofShape } from './roof-material';
import { ringAreaM2 } from './roof-polygons';
import { type ProfilePart, type ProfileRoof, profileRoof, type StandingWall } from './roof-profile';
import { distance, type PlanPoint, ringArea } from './wavefront-lines';

/**
 * Every roof shape on any outline (`T-M05-002`, part e): Flat, Shed, Gable and Hip, and under More
 * shapes sawtooth, monitor, curved, butterfly, mansard and gambrel. A shape and one slope set every
 * side; a side a person set keeps its own slope, eave height and end. A shape that cannot be built
 * on an outline falls back to the nearest that can, and at last to flat: a roof is never refused.
 */

/** What one side holds of its own, over the shape's. */
export interface SideOwn {
  /** `gable`: a gable end. `hip` or `eave`: a face rises from the side. */
  readonly end?: 'eave' | 'gable' | 'hip';
  readonly slopeDeg?: number;
  readonly eaveM?: number;
}

export interface RoofForm {
  readonly shape: Exclude<RoofShape, 'any'>;
  readonly slopeDeg: number;
  /** A gable's ridge turned 90° on a four-sided roof. */
  readonly turned?: boolean;
  /** The side a shed's low edge is, a sawtooth's glass faces, or a strip roof is measured from. */
  readonly side?: number;
  readonly teeth?: number;
  /** A mansard's or a gambrel's upper slope, and how far in its slope breaks. */
  readonly upperSlopeDeg?: number;
  readonly breakInM?: number;
  /** A monitor's raised middle. */
  readonly raisedHeightM?: number;
  readonly raisedWidthM?: number;
  /** Where a butterfly's valley sits: 0 at the side it is measured from, 1 at the far edge. */
  readonly valleyAt?: number;
  /** How many faces a curved roof is made of: 4 to 8. */
  readonly segments?: number;
  readonly sides?: readonly SideOwn[];
}

export interface FormedRoof extends BuiltRoof {
  readonly walls: readonly StandingWall[];
  /** The shape built: the one asked for, or the one it fell back to. */
  readonly built: RoofShape;
}

const FOUR = 4;
const CURVED_FEWEST = 4;
const CURVED_MOST = 8;
const TEETH_DEFAULT = 3;
const HALF = 0.5;
const MANSARD_UPPER_DEG = 25;
const MANSARD_BREAK_M = 0.6;
const RADIANS = Math.PI / 180;

const lengthOf = (corners: readonly GroundPoint[], side: number) => {
  const from = corners[side] as GroundPoint;
  const to = corners[(side + 1) % corners.length] as GroundPoint;
  return Math.hypot(to.east - from.east, to.north - from.north);
};

/** The roof's longest side: a strip roof with no side picked is measured from it. */
export function longestSide(corners: readonly GroundPoint[]): number {
  let longest = 0;
  corners.forEach((_, side) => {
    if (lengthOf(corners, side) > lengthOf(corners, longest)) longest = side;
  });
  return longest;
}

/** A flat roof: one face, the outline itself. */
function flatRoof(corners: readonly GroundPoint[]): FormedRoof {
  const area = ringArea(corners.map((corner) => ({ x: corner.east, y: corner.north })));
  const ring = area >= 0 ? corners : [...corners].reverse();
  const areaM2 = ringAreaM2(ring);
  const face: BuiltFace = {
    side: 0,
    ring: 0,
    corners: ring.map((corner) => ({ ...corner, up: 0 })),
    edges: ring.map((): FaceEdge => 'eave'),
    slopeDeg: 0,
    downDeg: 0,
    areaM2,
    surfaceM2: areaM2,
    upper: false,
  };
  return { faces: [face], topM: 0, walls: [], built: 'flat' };
}

/**
 * The sides that are gable ends when no person has said: on a four-sided roof the shorter pair
 * (the other pair when the ridge is turned); on any other outline, the ends of its wings — the
 * sides whose hip face is a triangle. A roof with no ridge at all (a pyramid) has no gable end.
 */
export function gableEnds(corners: readonly GroundPoint[], turned: boolean): number[] {
  const cleaned = outlineForFaces(corners);
  const sideOf = (i: number) => (cleaned.sides[i] as readonly number[])[0] as number;
  if (cleaned.points.length === FOUR) {
    const span = (i: number) =>
      distance(cleaned.points[i] as PlanPoint, cleaned.points[(i + 1) % FOUR] as PlanPoint);
    const evenLonger = span(0) + span(2) >= span(1) + span(3);
    // The ridge runs along the longer pair: the shorter pair are its ends.
    const ends = evenLonger !== turned ? [1, 3] : [0, 2];
    return ends.map(sideOf);
  }
  const hip = facesFromSides({
    corners,
    sides: corners.map(() => ({ gable: false, slopeDeg: 30, eaveM: 0 })),
  });
  if (hip === null) return [];
  const ends = hip.faces.filter((face) => face.corners.length === 3).map((face) => face.side);
  return ends.length < cleaned.points.length ? ends : [];
}

/** How each side shapes a gable, a hip, a mansard or a gambrel roof. */
function sidesOf(corners: readonly GroundPoint[], form: RoofForm): SideShape[] {
  const gabled = form.shape === 'gable' || form.shape === 'gambrel';
  const ends = gabled ? gableEnds(corners, form.turned === true) : [];
  const twoSlopes = form.shape === 'mansard' || form.shape === 'gambrel';
  const upper = twoSlopes
    ? {
        slopeDeg: form.upperSlopeDeg ?? MANSARD_UPPER_DEG,
        breakInM: form.breakInM ?? MANSARD_BREAK_M,
      }
    : undefined;
  return corners.map((_, side) => {
    const own = form.sides?.[side] ?? {};
    const gable = own.end === undefined ? ends.includes(side) : own.end === 'gable';
    const shape = { gable, slopeDeg: own.slopeDeg ?? form.slopeDeg, eaveM: own.eaveM ?? 0 };
    return upper === undefined ? shape : { ...shape, upper };
  });
}

/** A roof built from each side's plane; with every side a gable end there is no face to build. */
function sidedRoof(
  corners: readonly GroundPoint[],
  form: RoofForm,
  holes: readonly ShapedRing[],
): FormedRoof | null {
  const sides = sidesOf(corners, form);
  if (sides.every((side) => side.gable)) return null;
  const built = facesFromSides({ corners, sides }, holes);
  if (built === null || built.faces.length === 0) return null;
  return { ...built, walls: [], built: form.shape };
}

/** A curved roof's profile: an arc that leaves each eave at the roof's slope, in straight faces. */
function arcParts(across: number, slopeDeg: number, segments: number): ProfilePart[] {
  const count = Math.min(Math.max(Math.round(segments), CURVED_FEWEST), CURVED_MOST);
  const spring = Math.min(Math.max(slopeDeg, 1), 89) * RADIANS;
  const radius = across / 2 / Math.sin(spring);
  const sunk = radius * Math.cos(spring);
  const upAt = (d: number) => Math.sqrt(Math.max(radius ** 2 - (d - across / 2) ** 2, 0)) - sunk;
  return Array.from({ length: count }, (_, i) => {
    const from = (across * i) / count;
    const to = (across * (i + 1)) / count;
    return { from, to, fromUp: Math.max(upAt(from), 0), toUp: Math.max(upAt(to), 0) };
  });
}

/** The profile of each strip roof, given how far the outline reaches across. */
function partsOf(form: RoofForm): (across: number) => ProfilePart[] {
  const rise = riseOf(form.slopeDeg);
  return (across) => {
    if (form.shape === 'sawtooth') {
      const teeth = Math.max(1, Math.round(form.teeth ?? TEETH_DEFAULT));
      const tooth = across / teeth;
      // Each tooth's glass stands at its start, facing the side measured from; its face runs down from the glass's top.
      return Array.from({ length: teeth }, (_, i) => ({
        from: i * tooth,
        to: (i + 1) * tooth,
        fromUp: rise * tooth,
        toUp: 0,
      }));
    }
    if (form.shape === 'butterfly') {
      const valley = across * Math.min(Math.max(form.valleyAt ?? HALF, 0), 1);
      return [
        { from: 0, to: valley, fromUp: rise * valley, toUp: 0 },
        { from: valley, to: across, fromUp: 0, toUp: rise * (across - valley) },
      ];
    }
    if (form.shape === 'monitor') {
      const width = Math.min(Math.max(form.raisedWidthM ?? across / FOUR, 0), across);
      const lift = Math.max(form.raisedHeightM ?? 1, 0);
      const edge = (across - width) / 2;
      const shoulder = rise * edge;
      const ridge = shoulder + lift + (rise * width) / 2;
      return [
        { from: 0, to: edge, fromUp: 0, toUp: shoulder },
        { from: edge, to: across / 2, fromUp: shoulder + lift, toUp: ridge },
        { from: across / 2, to: across - edge, fromUp: ridge, toUp: shoulder + lift },
        { from: across - edge, to: across, fromUp: shoulder, toUp: 0 },
      ];
    }
    if (form.shape === 'curved')
      return arcParts(across, form.slopeDeg, form.segments ?? CURVED_MOST);
    return [{ from: 0, to: across, fromUp: 0, toUp: rise * across }];
  };
}

const STRIP_SHAPES: readonly RoofShape[] = ['shed', 'sawtooth', 'butterfly', 'monitor', 'curved'];

function stripRoof(corners: readonly GroundPoint[], form: RoofForm): FormedRoof | null {
  const side = form.side ?? longestSide(corners);
  const roof: ProfileRoof | null = profileRoof(corners, side, partsOf(form));
  if (roof === null || roof.faces.length === 0) return null;
  return { faces: roof.faces, topM: roof.topM, walls: roof.walls, built: form.shape };
}

/**
 * The roof a shape makes over an outline. A shape that cannot be built there falls back — a gable
 * to a hip, any to flat — so every outline gets a roof.
 */
export function roofFormed(
  corners: readonly GroundPoint[],
  form: RoofForm,
  holes: readonly ShapedRing[] = [],
): FormedRoof {
  if (form.shape === 'flat') return flatRoof(corners);
  if (STRIP_SHAPES.includes(form.shape)) return stripRoof(corners, form) ?? flatRoof(corners);
  const asked = sidedRoof(corners, form, holes);
  if (asked !== null) return asked;
  const hipped = sidedRoof(corners, { ...form, shape: 'hip', sides: undefined }, holes);
  return hipped ?? flatRoof(corners);
}

/** The slope that lifts a ridge to a height, and the height a slope lifts it to, over one run. */
export function slopeForRise(riseM: number, runM: number): number {
  return Math.atan2(Math.max(riseM, 0), Math.max(runM, 0)) / RADIANS;
}
export function riseForSlope(slopeDeg: number, runM: number): number {
  return riseOf(slopeDeg) * runM;
}
