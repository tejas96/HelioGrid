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
import { handFacesKept } from './roof-hand-faces';
import { roofSidesOf } from './roof-kind';
import { type RoofFacts, roofShapeNow } from './roof-levels';
import {
  isSideNumber,
  LOWER_SLOPE_SLIDE,
  type NumberAt,
  ROOF_NUMBER_SPECS,
  type RoofNumber,
  type RoofNumberShown,
  SIDE_FIELD,
} from './roof-numbers';
import { parapetNow } from './roof-open-edges';
import { reachAcrossM } from './roof-profile';

/**
 * A roof's numbers as they stand (`T-M05-002`, part e): what a person stored, else the studio's
 * own value — the market's, the material's or the shape's. A side's own parapet height and
 * setback follow its roof's until a person sets them.
 */

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
    case 'eave':
      // A side's eave stands on the roof's low edge until a person raises it.
      return 0;
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
    case 'eave':
      // Only a side holds its own eave.
      return undefined;
    case 'parapet_height':
      return parapet?.setBy === 'person' ? parapet.metres : undefined;
    case 'setback':
      return roof.setback?.metres;
    case 'thickness':
      return parapet?.thickness?.metres;
  }
}

/**
 * A number as it stands: a side's own where the side is named, a face's own slope where a face
 * drawn by hand is named, else the roof's. A face follows its roof's slope until a person sets its
 * own: its reset brings the roof's back.
 */
export function roofNumberOf(
  document: StudioDocument,
  at: NumberAt,
  facts: RoofFacts,
): RoofNumberShown | null {
  const shown = roofNumberAt(document, at, facts);
  const roof = document.roofs[at.roof];
  const face = at.key === 'slope' && at.face != null ? at.face : null;
  const slope = roof === undefined || face === null ? undefined : handFacesKept(roof)[face]?.slope;
  if (shown === null || slope === undefined) return shown;
  // A face no person set follows the roof's slope as it is now, whatever it stores.
  const value = slope.setBy === 'person' ? slope.degrees : shown.value;
  return {
    ...shown,
    value,
    byPerson: slope.setBy === 'person',
    system: shown.value,
    outside: value < shown.slide.min || value > shown.slide.max,
  };
}

/** A number as it stands on the roof, or on a side named. */
function roofNumberAt(
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
