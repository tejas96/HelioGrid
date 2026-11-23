import type { CompassWay } from './compass';
import type { GroundPoint } from './ground';
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

/** A floor on the height slider: G is the ground floor's roof, plinth and one storey. */
export interface FloorTick {
  readonly metres: number;
  /** 0 for G, 1 for G+1, … */
  readonly floor: number;
}

/** Which way a sloped roof runs down, in words: one way, or the ways its faces look. */
export type SlopeWay =
  | { readonly kind: 'down'; readonly way: CompassWay; readonly bearing: number }
  | { readonly kind: 'faces'; readonly ways: readonly CompassWay[] };

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
  readonly shape: { readonly is: RoofShape; readonly byPerson: boolean } | null;
  readonly height: {
    readonly from: HeightFrom;
    readonly ticks: readonly FloorTick[];
    /** The floor its height stands on now; `null` between floors. */
    readonly floor: FloorTick | null;
  };
  /** A sloped roof's slope, the way it runs and how high its ridge stands over its low edge. */
  readonly slope: {
    readonly number: RoofNumberShown;
    readonly way: SlopeWay;
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
  /** The roof's one parapet setting; `null` for a roof with no walls of its own. */
  readonly parapet: {
    readonly allRound: boolean;
    readonly byPerson: boolean;
    readonly height: RoofNumberShown;
    /** Higher than a parapet usually stands: check it on site, whoever set it. */
    readonly waits: boolean;
  } | null;
  readonly setback: RoofNumberShown | null;
  readonly details: {
    readonly thickness: RoofNumberShown;
    readonly build: ParapetBuild;
    readonly measured: LengthsMeasured;
  } | null;
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
  readonly role: SideRole | null;
  readonly waits: boolean;
}

/** The roof's floors under the height slider's ends: G, G+1, … */
export function floorTicks(
  plinthM: number,
  storeyM: number,
  slide: { readonly min: number; readonly max: number },
): FloorTick[] {
  const ticks: FloorTick[] = [];
  if (!(storeyM > 0)) return ticks;
  for (let floor = 0; ; floor += 1) {
    const metres = Math.round((plinthM + storeyM * (floor + 1)) * 100) / 100;
    if (metres > slide.max) break;
    if (metres >= slide.min) ticks.push({ metres, floor });
  }
  return ticks;
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
