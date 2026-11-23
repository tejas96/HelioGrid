import type { Roof, StudioDocument } from './document';
import { hasTwoSlopes, roofFirstSlopeDeg, roofFormOf, roofOverhangM } from './roof-built';
import {
  longestSide,
  MANSARD_BREAK_M,
  MANSARD_UPPER_DEG,
  RAISED_HEIGHT_M,
  RAISED_WIDTH_SHARE,
  TEETH_DEFAULT,
} from './roof-forms';
import { roofSidesOf } from './roof-kind';
import { type RoofFacts, roofShapeNow } from './roof-levels';
import { parapetNow } from './roof-open-edges';
import {
  OVERHANG_MAX_M,
  PARAPET_HEIGHT_MAX_M,
  PARAPET_HEIGHT_MIN_M,
  ROOF_TEETH_MAX,
  SETBACK_MAX_M,
  SLOPE_MAX_DEG,
  WALL_THICKNESS_MAX_M,
  WALL_THICKNESS_MIN_M,
} from './roof-parts';
import { reachAcrossM } from './roof-profile';

/**
 * The numbers a roof's sheet sets beyond its height (`T-M05-002`, part e): for each, its slider's
 * track, how far typing takes it, the studio's own value, and how a person's value is kept. A roof
 * stores only what a person set: an absent value is the studio's, so a reset takes it away and a
 * later change of material or market still reaches it. A side's own parapet height and setback
 * follow its roof's until a person sets them.
 */
export const ROOF_NUMBERS = [
  'slope',
  'upper_slope',
  'break_in',
  'teeth',
  'raised_height',
  'raised_width',
  'valley',
  'overhang',
  'parapet_height',
  'setback',
  'thickness',
] as const;
export type RoofNumber = (typeof ROOF_NUMBERS)[number];

/** The numbers a side holds of its own. */
export const SIDE_NUMBERS = ['parapet_height', 'setback'] as const satisfies readonly RoofNumber[];
export type SideNumber = (typeof SIDE_NUMBERS)[number];

/** How a number is shown: a length, an angle, a count, or a share of the roof's width. */
export type RoofNumberUnit = 'metres' | 'degrees' | 'count' | 'share';

interface Track {
  readonly min: number;
  readonly max: number;
}

export interface RoofNumberSpec {
  readonly unit: RoofNumberUnit;
  /** The slider's ends and step. */
  readonly slide: Track & { readonly step: number };
  /** How far typing takes it: a low band, a steep roof. No value between its ends is refused. */
  readonly typed: Track;
}

/** A mansard's or a gambrel's lower slope is steep: its slider's track. */
const LOWER_SLOPE_SLIDE = { min: 30, max: 80, step: 1 } as const;

/** A parapet above this keeps its amber dot, whoever set it: check it on site. */
export const PARAPET_CHECK_ABOVE_M = 1.5;

export const ROOF_NUMBER_SPECS: Record<RoofNumber, RoofNumberSpec> = {
  slope: {
    unit: 'degrees',
    slide: { min: 0, max: 60, step: 1 },
    typed: { min: 0, max: SLOPE_MAX_DEG },
  },
  upper_slope: {
    unit: 'degrees',
    slide: { min: 0, max: 45, step: 1 },
    typed: { min: 0, max: SLOPE_MAX_DEG },
  },
  break_in: {
    unit: 'metres',
    slide: { min: 0.2, max: 1.6, step: 0.05 },
    typed: { min: 0.05, max: SETBACK_MAX_M },
  },
  teeth: {
    unit: 'count',
    slide: { min: 1, max: 12, step: 1 },
    typed: { min: 1, max: ROOF_TEETH_MAX },
  },
  raised_height: {
    unit: 'metres',
    slide: { min: 0.2, max: 3, step: 0.05 },
    typed: { min: 0.1, max: 10 },
  },
  raised_width: {
    unit: 'metres',
    slide: { min: 0.5, max: 10, step: 0.1 },
    typed: { min: 0.2, max: 100 },
  },
  valley: {
    unit: 'share',
    slide: { min: 0.1, max: 0.9, step: 0.05 },
    typed: { min: 0.1, max: 0.9 },
  },
  overhang: {
    unit: 'metres',
    slide: { min: 0, max: 1.5, step: 0.05 },
    typed: { min: 0, max: OVERHANG_MAX_M },
  },
  parapet_height: {
    unit: 'metres',
    slide: { min: 0.3, max: 2, step: 0.05 },
    typed: { min: PARAPET_HEIGHT_MIN_M, max: PARAPET_HEIGHT_MAX_M },
  },
  setback: {
    unit: 'metres',
    slide: { min: 0, max: 3, step: 0.05 },
    typed: { min: 0, max: SETBACK_MAX_M },
  },
  thickness: {
    unit: 'metres',
    slide: { min: 0.1, max: 0.5, step: 0.01 },
    typed: { min: WALL_THICKNESS_MIN_M, max: WALL_THICKNESS_MAX_M },
  },
};

/** One number as a sheet shows it. */
export interface RoofNumberShown extends RoofNumberSpec {
  readonly key: RoofNumber;
  /** The side whose own value it is; `null` for the roof's. */
  readonly side: number | null;
  readonly value: number;
  /** A person set it; else it is the studio's, or on a side the roof's. */
  readonly byPerson: boolean;
  /** What a reset brings back: the studio's value, or on a side the roof's. */
  readonly system: number;
  /** Past the slider's ends: only the box shows it. */
  readonly outside: boolean;
}

/** Which roof, and which of its sides for a side's own value. */
export interface NumberAt {
  readonly roof: number;
  readonly key: RoofNumber;
  readonly side?: number | null;
}

export const isSideNumber = (key: RoofNumber): key is SideNumber =>
  (SIDE_NUMBERS as readonly RoofNumber[]).includes(key);

/** The side a strip roof is measured from: the one it stores, else its longest. */
function measuredFrom(roof: Roof, facts: RoofFacts): number {
  return roofFormOf(roof, facts).side ?? longestSide(roof.corners);
}

/** The studio's own value of a roof's number: the market's, the material's, or the shape's. */
function systemOf(document: StudioDocument, roof: Roof, key: RoofNumber, facts: RoofFacts): number {
  switch (key) {
    case 'slope':
      return roofFirstSlopeDeg(roof, facts);
    case 'upper_slope':
      return MANSARD_UPPER_DEG;
    case 'break_in':
      return MANSARD_BREAK_M;
    case 'teeth':
      return TEETH_DEFAULT;
    case 'raised_height':
      return RAISED_HEIGHT_M;
    case 'raised_width':
      return reachAcrossM(roof.corners, measuredFrom(roof, facts)) * RAISED_WIDTH_SHARE;
    case 'valley':
      return 1 / 2;
    case 'overhang':
      return roofOverhangM({ ...roof, overhang: undefined }, facts);
    case 'parapet_height':
      return facts.parapetHeightM;
    case 'setback':
      return facts.setbackM;
    case 'thickness':
      return parapetNow(document, { ...roof, parapet: undefined }, facts).thicknessM;
  }
}

/** What a person stored for a roof's number; `undefined` where it is the studio's. */
function storedOf(roof: Roof, key: RoofNumber): number | undefined {
  const { shape, parapet } = roof;
  switch (key) {
    case 'slope':
      return roof.slope?.degrees;
    case 'upper_slope':
      return shape?.upperSlope?.degrees;
    case 'break_in':
      return shape?.breakIn?.metres;
    case 'teeth':
      return shape?.teeth?.count;
    case 'raised_height':
      return shape?.raisedHeight?.metres;
    case 'raised_width':
      return shape?.raisedWidth?.metres;
    case 'valley':
      return shape?.valleyAt?.share;
    case 'overhang':
      return roof.overhang?.metres;
    case 'parapet_height':
      return parapet?.setBy === 'person' ? parapet.metres : undefined;
    case 'setback':
      return roof.setback?.metres;
    case 'thickness':
      return parapet?.thickness?.metres;
  }
}

export const SIDE_FIELD = { parapet_height: 'parapetM', setback: 'setbackM' } as const;

/** A number as it stands: a side's own where the side is named, else the roof's. */
export function roofNumberOf(
  document: StudioDocument,
  at: NumberAt,
  facts: RoofFacts,
): RoofNumberShown | null {
  const roof = document.roofs[at.roof];
  if (roof === undefined) return null;
  const lower = at.key === 'slope' && hasTwoSlopes(roofShapeNow(roof, facts));
  const spec = lower
    ? { ...ROOF_NUMBER_SPECS.slope, slide: LOWER_SLOPE_SLIDE }
    : ROOF_NUMBER_SPECS[at.key];
  const own = storedOf(roof, at.key);
  const roofs = own ?? systemOf(document, roof, at.key, facts);
  const side = at.side ?? null;
  // A side's own value follows its roof's until a person sets it: its reset brings the roof's back.
  const sides = side !== null && isSideNumber(at.key) ? roofSidesOf(roof)[side] : undefined;
  const held = sides === undefined || !isSideNumber(at.key) ? undefined : sides[SIDE_FIELD[at.key]];
  const onSide = sides !== undefined;
  const value = onSide ? (held ?? roofs) : roofs;
  return {
    ...spec,
    key: at.key,
    side: onSide ? side : null,
    value,
    byPerson: onSide ? held !== undefined : own !== undefined,
    system: onSide ? roofs : systemOf(document, roof, at.key, facts),
    outside: value < spec.slide.min || value > spec.slide.max,
  };
}
