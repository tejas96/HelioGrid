import type { CompassWay } from './compass';
import type { GroundPoint } from './ground';
import type { HandFacesDrawn } from './roof-hand-faces';
import type { RoofSits } from './roof-list';
import type { RoofMaterial, RoofShape } from './roof-material';
import type { RoofName } from './roof-names';
import type { RoofNumberShown } from './roof-numbers';
import type { LengthsMeasured, ParapetBuild, RoofKind } from './roof-parts';

/**
 * A roof's sheet and a side's sheet, row by row (`T-M05-002`, part e, board section 6): one row
 * per value, each with its value and, where it waits for a person, its amber dot. The kernel fills
 * them (`roof-sheet-build.ts`); a screen only draws them.
 */

/** Where a roof's height is counted from, which names its row. */
export type HeightFrom =
  /** Height from ground. */
  | { readonly kind: 'ground' }
  /** Height above Roof n: a roof standing on another. */
  | { readonly kind: 'above'; readonly roof: RoofName }
  /** Height of low edge: a sloped roof's height is its lowest edge. */
  | { readonly kind: 'low_edge' };

/** The roof's sides once a person set some apart from the parapet switch. */
export interface ParapetApart {
  /** Sides with a wall, of all its sides. */
  readonly walled: number;
  readonly of: number;
  /** The one side set apart, by the way it looks; `null` where more than one is. */
  readonly only: CompassWay | null;
}

/** A floor on the height slider: G is the ground floor's roof, plinth and one storey. */
export interface FloorTick {
  readonly metres: number;
  /** 0 for G, 1 for G+1, … */
  readonly floor: number;
  /** Its word shows under the track: every floor of a house, one in a few of a tall block's. */
  readonly named: boolean;
}

/** The most floor words under the track before they crowd a phone's sheet. */
const NAMED_FLOORS_MAX = 8;

/** Which way a sloped roof runs down, in words: one way, or the ways its faces look. */
/** A way a slope runs down, as a word and in whole degrees clockwise from north (E097). */
export interface WayAt {
  readonly way: CompassWay;
  readonly bearing: number;
}

export type SlopeWay =
  | ({ readonly kind: 'down' } & WayAt)
  | { readonly kind: 'faces'; readonly ways: readonly WayAt[] };

/** A stair room's Stairs row: the stairs move to a side, or outside, without a drag. */
export interface StairsRow {
  /** Its sides that open onto the roof, each with the way it looks and its middle, in metres along it. */
  readonly sides: readonly {
    readonly side: number;
    readonly faces: CompassWay;
    readonly middleM: number;
  }[];
  /** Where the stairs are: one of its sides, or outside on a roof's edge; `null` with none. */
  readonly on: number | 'outside' | null;
  readonly byPerson: boolean;
}

/** What a roof crosses as it is changed: allowed, lit on the model and marked to check. */
export interface RoofCrossing {
  readonly kind: 'wall_above' | 'ridge_through' | 'sunk' | 'past_edge';
  /** The roof crossed: the one its walls rise above, its ridge runs through, or it stands on. */
  readonly roof: number;
  readonly name: RoofName;
}

export interface RoofSheetRows {
  readonly roof: number;
  readonly name: RoofName;
  readonly sits: RoofSits;
  /** From above where it is flat, along its slope where it slopes. */
  readonly areaM2: number;
  /** What it is: for a roof standing on another, or part of one. */
  readonly kind: {
    readonly is: RoofKind;
    readonly choices: readonly RoofKind[];
    readonly waits: boolean;
  } | null;
  /** What it is made of; `null` for a hole, made of nothing. */
  readonly material: {
    readonly type: RoofMaterial;
    readonly name: string | null;
    readonly confirmed: boolean;
  } | null;
  readonly shape: {
    readonly is: RoofShape;
    readonly byPerson: boolean;
    /** The picker's first tiles, and the rest behind More shapes. */
    readonly first: readonly RoofShape[];
    readonly later: readonly RoofShape[];
    /** The shape now is behind More shapes: the picker opens with them shown. */
    readonly isLater: boolean;
  } | null;
  readonly height: {
    readonly from: HeightFrom;
    readonly ticks: readonly FloorTick[];
    /** The floor its height stands on now; `null` between floors. */
    readonly floor: FloorTick | null;
  };
  /** A sloped roof's slope, the way it runs and how high its ridge stands over its low edge. */
  readonly slope: {
    readonly number: RoofNumberShown;
    /**
     * The way it runs down; `null` on an Any-shape roof whose faces are not all drawn: it stands
     * flat, and its slope is the one each face starts with.
     */
    readonly way: SlopeWay | null;
    readonly ridgeAboveM: number;
    /** The ridge's longest run on the plan, where its height arrow stands; `null` with no ridge. */
    readonly ridge: { readonly from: GroundPoint; readonly to: GroundPoint } | null;
    /** Its low side runs against a taller roof's wall: rain runs into it. */
    readonly lowAgainst: RoofName | null;
    readonly waits: boolean;
  } | null;
  /** The shape's own numbers: teeth, an upper slope and where it breaks, the raised middle, the valley. */
  readonly extras: readonly RoofNumberShown[];
  /** How far a sloped roof runs past its walls. */
  readonly overhang: RoofNumberShown | null;
  readonly setback: RoofNumberShown | null;
  /**
   * The roof's one parapet setting and everything about its wall, shown under its switch while a
   * wall stands; `null` for a roof with no walls of its own.
   */
  readonly parapet: {
    /** The switch: a parapet all round. */
    readonly allRound: boolean;
    readonly byPerson: boolean;
    /** A wall stands on some stretch of the roof's edge: its details show. */
    readonly walls: boolean;
    /** Sides a person set apart from the switch in 3D; `null` while none is. */
    readonly apart: ParapetApart | null;
    readonly build: ParapetBuild;
    readonly height: RoofNumberShown;
    /** A wall's thickness; `null` for a railing, which stands its own few centimetres. */
    readonly thickness: RoofNumberShown | null;
    readonly measured: LengthsMeasured;
    /** Higher than a parapet usually stands: check it on site, whoever set it. */
    readonly waits: boolean;
  } | null;
  /** What it crosses now: lit on the model with a tag, each marked to check. */
  readonly crossings: readonly RoofCrossing[];
  /** A stair room's Stairs row (E120): its sides that may hold them, and where they are. */
  readonly stairs: StairsRow | null;
  /**
   * An Any-shape roof's Faces row (E082): how far its faces are drawn by hand, and how many it
   * keeps; `null` for any other shape.
   */
  readonly faces: { readonly drawn: HandFacesDrawn; readonly count: number } | null;
  /** Something on this sheet waits for a person: the sheet says once "Check it on site." */
  readonly waits: boolean;
}

/** What one side of a sloped roof is to its shape: the one choice its sheet offers. */
export type SideRole =
  /** A shed's sides: this one is the low side, or could be. */
  | { readonly kind: 'low'; readonly is: boolean }
  /** A sawtooth's sides: the glass faces this way, or could. */
  | { readonly kind: 'glass'; readonly is: boolean }
  /** A gable's or a hip's end: a gable end or a hip. */
  | { readonly kind: 'end'; readonly end: 'gable' | 'hip' };

/** Why a side has its parapet, or has none. */
export type SideWallWhy =
  /** The roof's one setting: Parapet all round, or none. */
  | { readonly kind: 'roof' }
  /** A person set this side. */
  | { readonly kind: 'person' }
  /** A roof of the same height meets it: a seam. */
  | { readonly kind: 'shared'; readonly with: RoofName }
  /** A higher roof's wall stands there. */
  | { readonly kind: 'under'; readonly with: RoofName };

export interface SideSheetRows {
  readonly roof: number;
  readonly side: number;
  readonly name: RoofName;
  /** The way the side looks out, as a word and in degrees. */
  readonly faces: CompassWay;
  readonly bearing: number;
  readonly parapet: { readonly on: boolean; readonly why: SideWallWhy };
  /** Its own parapet height, following the roof's until set; `null` where it has no wall. */
  readonly parapetHeight: RoofNumberShown | null;
  readonly setback: RoofNumberShown;
  /** Its own overhang on a sloped roof, following the roof's until set; `null` where it has none. */
  readonly overhang: RoofNumberShown | null;
  /**
   * Its own slope and how far its eave stands above the roof's low edge, following the roof's
   * until set: on a roof built side by side (gable, hip, mansard, gambrel), and never on a gable
   * end, which has no face. `null` where the side has none.
   */
  readonly slope: RoofNumberShown | null;
  readonly eave: RoofNumberShown | null;
  readonly role: SideRole | null;
  /** Its parapet height waits for a person: above what is checked on site. */
  readonly heightWaits: boolean;
  /** Something on the side waits for a person: its height, or a low side against a wall. */
  readonly waits: boolean;
}

/** The roof's floors under the height slider's ends: G, G+1, … */
export function floorTicks(
  plinthM: number,
  storeyM: number,
  slide: { readonly min: number; readonly max: number },
): FloorTick[] {
  if (!(storeyM > 0)) return [];
  const floors: { metres: number; floor: number }[] = [];
  for (let floor = 0; ; floor += 1) {
    const metres = Math.round((plinthM + storeyM * (floor + 1)) * 100) / 100;
    if (metres > slide.max) break;
    if (metres >= slide.min) floors.push({ metres, floor });
  }
  const every = Math.ceil(floors.length / NAMED_FLOORS_MAX);
  return floors.map((at) => ({ ...at, named: at.floor % every === 0 }));
}

/** A height this near a floor stands on it. */
const ON_FLOOR_M = 0.005;

/** The floor a height stands on; `null` between floors. */
export function floorAt(ticks: readonly FloorTick[], metres: number): FloorTick | null {
  return ticks.find((tick) => Math.abs(tick.metres - metres) <= ON_FLOOR_M) ?? null;
}

/** − and + on the height: the next floor down or up; `null` past the last one. */
export function floorStepped(
  ticks: readonly FloorTick[],
  metres: number,
  by: 1 | -1,
): number | null {
  const next =
    by > 0
      ? ticks.find((tick) => tick.metres > metres + ON_FLOOR_M)
      : [...ticks].reverse().find((tick) => tick.metres < metres - ON_FLOOR_M);
  return next?.metres ?? null;
}
