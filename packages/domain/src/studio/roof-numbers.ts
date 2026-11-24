import { METRES_PER_FOOT } from '../format/measurement';
import type { MeasurementSystem } from '../format/pack';
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

/**
 * The numbers a roof's sheet sets beyond its height (`T-M05-002`, part e): for each, its slider's
 * track, how far typing takes it, the studio's own value, and how a person's value is kept. A roof
 * stores only what a person set: an absent value is the studio's, so a reset takes it away and a
 * later change of material or market still reaches it. A side's own parapet height, setback and
 * overhang follow its roof's until a person sets them.
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
export const SIDE_NUMBERS = [
  'parapet_height',
  'setback',
  'overhang',
] as const satisfies readonly RoofNumber[];
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
export const LOWER_SLOPE_SLIDE = { min: 30, max: 80, step: 1 } as const;

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
  /** On an Any-shape roof, the face drawn by hand whose own slope this is (`slope` alone). */
  readonly face?: number | null;
}

/** Where a side keeps each of its own numbers. */
export const SIDE_FIELD = {
  parapet_height: 'parapetM',
  setback: 'setbackM',
  overhang: 'overhangM',
} as const;

export const isSideNumber = (key: RoofNumber): key is SideNumber =>
  (SIDE_NUMBERS as readonly RoofNumber[]).includes(key);

/** A value kept to its step's grain between the ends typing allows: nothing is refused. */
export function roofNumberHeld(key: RoofNumber, value: number): number {
  const { typed, slide, unit } = ROOF_NUMBER_SPECS[key];
  const grain = unit === 'metres' ? 0.01 : slide.step;
  const clamped = Math.min(typed.max, Math.max(typed.min, Number.isFinite(value) ? value : 0));
  return Math.round(Math.round(clamped / grain) * grain * 100) / 100;
}

/** A number as its box takes it: in the reader's units, with its ends, and back to what is stored. */
export interface RoofNumberTyped {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** The unit beside the box: never a word, so never translated. */
  readonly unit: string;
  /** A typed number, back in the unit the roof stores. */
  back(typed: number): number;
}

const PERCENT = 100;

/**
 * The box a number is typed in: a length in metres, or in feet where feet are used; a slope in
 * degrees; a valley's place as a share in per cent; a count as it is.
 */
export function roofNumberTyped(
  shown: RoofNumberShown,
  system: MeasurementSystem,
): RoofNumberTyped {
  const { unit, typed, slide } = shown;
  const keep = (value: number) => Math.round(value * PERCENT) / PERCENT;
  if (unit === 'metres') {
    const feet = system === 'imperial';
    const by = feet ? 1 / METRES_PER_FOOT : 1;
    return {
      value: keep(shown.value * by),
      min: keep(typed.min * by),
      max: keep(typed.max * by),
      step: feet ? 0.1 : 0.01,
      unit: feet ? 'ft' : 'm',
      back: (value) => value / by,
    };
  }
  if (unit === 'share') {
    return {
      value: keep(shown.value * PERCENT),
      min: typed.min * PERCENT,
      max: typed.max * PERCENT,
      step: 1,
      unit: '%',
      back: (value) => value / PERCENT,
    };
  }
  return {
    value: shown.value,
    min: typed.min,
    max: typed.max,
    step: slide.step,
    unit: unit === 'degrees' ? '°' : '',
    back: (value) => value,
  };
}
