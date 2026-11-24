import type { ProvenanceTier } from '../format/qualified';
import type { GroundPoint } from './ground';
import type { RoofFixedLike, RoofMaterial, RoofShape } from './roof-material';

/**
 * What a roof holds beyond its outline (`T-M05-002`, part e): what it is, what it is made of, its
 * shape and slope, its parapet and setback, and what each side holds of its own. Every value keeps
 * who set it (`T-M05-002`, *Values*).
 */

/**
 * Who set a value: the system, from the market pack or a data source, or a person, by typing,
 * sliding or dragging (`T-M05-002`, *Values*). A reset hands the value back to the system.
 */
export const VALUE_SETTERS = ['system', 'person'] as const;
export type ValueSetter = (typeof VALUE_SETTERS)[number];

/**
 * Where a value came from: who set it, and its tier where that is not the setter's usual one — a
 * height read from the height map is the system's and `derived`, a ridge a person measured with a
 * laser is theirs and `measured`. Absent, the system's value is `assumed` and a person's `estimated`.
 */
export interface ValueSource {
  readonly setBy: ValueSetter;
  readonly tier?: ProvenanceTier;
}

/** A parapet stands between a low band and a tall wall; no height between them is refused. */
export const PARAPET_HEIGHT_MIN_M = 0.1;
export const PARAPET_HEIGHT_MAX_M = 3;
/** A wall is between a sheet and a thick masonry wall. */
export const WALL_THICKNESS_MIN_M = 0.02;
export const WALL_THICKNESS_MAX_M = 1;
/** A setback or an overhang is never wider than this. */
export const SETBACK_MAX_M = 20;
export const OVERHANG_MAX_M = 5;
/** A slope stops short of a wall. */
export const SLOPE_MAX_DEG = 89;
/** A sawtooth roof has at most this many teeth. */
export const ROOF_TEETH_MAX = 60;
/** A roof of any shape holds at most this many faces drawn by hand. */
export const ROOF_HAND_FACES_MAX = 32;
/** A name a person types for a roof type not on the list. */
export const MATERIAL_NAME_MAX = 60;

/** A length or a height in metres, with where it came from. */
export interface SetMetres extends ValueSource {
  readonly metres: number;
}

/** A slope in degrees, with where it came from. */
export interface SetDegrees extends ValueSource {
  readonly degrees: number;
}

/**
 * A roof's height in metres and who set it (`roof-height.ts`): above the ground, or above the
 * roof it stands on (`Roof.on`).
 */
export interface RoofHeight extends ValueSource {
  readonly metres: number;
}

/**
 * What a roof is (`T-M05-002`, part e): a building on the ground, a stair room, an upper floor or
 * an open shed on another roof, a hole in one, a dormer in a sloped one, or a separate part carved
 * out of a roof of the same building. The set grows (a carport, water, a wall), so a stored kind is
 * read open: one this build does not know is kept, and read as a building (`roof-kind.ts`).
 */
export const ROOF_KINDS = [
  'building',
  'stair_room',
  'upper_floor',
  'open_shed',
  'hole',
  'dormer',
  'separate_part',
] as const;
export type RoofKind = (typeof ROOF_KINDS)[number];

/** A name of an open set as stored: one of this build's, or a later build's. */
export type Stored<Known extends string> = Known | (string & {});

/** What a roof is, and who said so: the studio's guess, or a person's pick. */
export interface RoofKindSet {
  readonly is: Stored<RoofKind>;
  readonly setBy: ValueSetter;
}

/** What a roof is made of (`roof-material.ts`), amber until a person confirms it. */
export interface RoofMaterialSet {
  readonly type: Stored<RoofMaterial>;
  /** The name a person typed for a type not on the list (`other`); it goes on the drawings. */
  readonly name?: string;
  /** What an `other` roof is fixed like; the mounting follows it. */
  readonly fixedLike?: Stored<RoofFixedLike>;
  readonly setBy: ValueSetter;
  readonly confirmed: boolean;
}

/** A parapet is a wall, or a railing, which casts almost no shade. */
export const PARAPET_BUILDS = ['wall', 'railing'] as const;
export type ParapetBuild = (typeof PARAPET_BUILDS)[number];

/**
 * Where a roof's lengths were measured to: the outside of its parapet, which then stands inside
 * the outline, or the inside, for a size taped between the parapets.
 */
export const LENGTHS_MEASURED = ['outside', 'inside'] as const;
export type LengthsMeasured = (typeof LENGTHS_MEASURED)[number];

/** The roof's one parapet setting: whether it runs all round, and how high above the floor. */
export interface RoofParapet extends SetMetres {
  readonly allRound: boolean;
  readonly build?: ParapetBuild;
  readonly thickness?: SetMetres;
  readonly lengthsMeasured?: LengthsMeasured;
}

/** What the end of a sloped roof is at a side: its eave, a gable end, or a hip. */
export const SIDE_ENDS = ['eave', 'gable', 'hip'] as const;
export type SideEnd = (typeof SIDE_ENDS)[number];

/**
 * What one side of a roof holds of its own, side i running from corner i to corner i + 1. Its
 * values are a person's: each differs from the roof's, an absent one follows the roof, and a reset
 * takes it away. Its marks — a shed's low side, a sawtooth's glass side, the stairs — say who
 * placed them. Everything kept by side lives here, so a turned roof turns it and a new corner
 * keeps each on its side. The entry is flat: one side is one small record.
 */
export interface RoofSide {
  /** The side's parapet where it differs from the roof's: off, or on. */
  readonly parapet?: boolean;
  /** Its own parapet height, in metres. */
  readonly parapetM?: number;
  readonly parapetBuild?: ParapetBuild;
  readonly setbackM?: number;
  readonly slopeDeg?: number;
  /** How far this side's eave stands above the roof's low edge, in metres, where it is not on it. */
  readonly eaveM?: number;
  readonly end?: Stored<SideEnd>;
  readonly overhangM?: number;
  /** The tier of the person's values here where it is not `estimated`: measured on site. */
  readonly tier?: ProvenanceTier;
  /** A shed roof's low side, and who put it here. */
  readonly low?: ValueSetter;
  /** The side a sawtooth roof's glass faces, and who put it here. */
  readonly glass?: ValueSetter;
  /** The stairs reach the roof on this side, this many metres along it from its first corner. */
  readonly stairsAt?: number;
  readonly stairsBy?: ValueSetter;
}

/** The shape of a roof's top (`roof-material.ts`), and what each shape needs beyond the one slope. */
/** One face of a roof of any shape, drawn by hand. */
export interface HandFaceSet {
  readonly corners: readonly GroundPoint[];
  readonly slope: SetDegrees;
  /** The face's side it slopes down to, side i running from corner i to corner i + 1. */
  readonly lowSide: number;
}

export interface RoofShapeSet {
  readonly is: Stored<RoofShape>;
  readonly setBy: ValueSetter;
  /** A gable's ridge turned 90° from the way it first ran. */
  readonly turned?: boolean;
  /** A sawtooth's teeth. */
  readonly teeth?: ValueSource & { readonly count: number };
  /**
   * Any shape: the faces a person drew, each with its slope and its low side (a side of the face,
   * from its first corner). They stand with the roof: a move or a turn carries them.
   */
  readonly faces?: readonly HandFaceSet[];
  /** A mansard's or a gambrel's upper slope; the roof's slope is its lower one. */
  readonly upperSlope?: SetDegrees;
  /** How far in from the edge a mansard's or a gambrel's slope breaks. */
  readonly breakIn?: SetMetres;
  /** A monitor's raised middle: how high above the faces beside it, and how wide. */
  readonly raisedHeight?: SetMetres;
  readonly raisedWidth?: SetMetres;
  /** Where a butterfly's valley sits across the roof: 0 at one eave, 1 at the other. */
  readonly valleyAt?: ValueSource & { readonly share: number };
}
