import type { Roof, StudioDocument } from './document';
import { roofSidesOf } from './roof-kind';
import { type RoofFacts, roofShapeNow } from './roof-levels';
import { parapetNow } from './roof-open-edges';
import type { RoofParapet, RoofShapeSet, RoofSide } from './roof-parts';
import {
  isSideNumber,
  type NumberAt,
  ROOF_NUMBER_SPECS,
  type RoofNumber,
  SIDE_FIELD,
} from './roof-values';

/**
 * A person sets one of a roof's numbers, or resets it (`T-M05-002`, part e). A roof stores only
 * what a person set: a reset takes the value away, and a record left holding nothing of a
 * person's goes with it.
 */

/** A value kept to its step's grain between the ends typing allows: nothing is refused. */
export function roofNumberHeld(key: RoofNumber, value: number): number {
  const { typed, slide, unit } = ROOF_NUMBER_SPECS[key];
  const grain = unit === 'metres' ? 0.01 : slide.step;
  const clamped = Math.min(typed.max, Math.max(typed.min, Number.isFinite(value) ? value : 0));
  return Math.round(Math.round(clamped / grain) * grain * 100) / 100;
}

const PERSON = { setBy: 'person' } as const;

/** A roof's shape record to add a shape's own number to: what is stored, else the shape it reads as. */
export function shapeRecordOf(roof: Roof, facts: RoofFacts): RoofShapeSet {
  return roof.shape ?? { is: roofShapeNow(roof, facts), setBy: 'system' };
}

/** The roof's parapet record to change: what is stored, else what the studio gives it. */
export function parapetRecordOf(
  document: StudioDocument,
  roof: Roof,
  facts: RoofFacts,
): RoofParapet {
  if (roof.parapet !== undefined) return roof.parapet;
  const now = parapetNow(document, roof, facts);
  return { allRound: now.allRound, metres: now.metres, setBy: 'system' };
}

export function roofWithSide(roof: Roof, side: number, change: (held: RoofSide) => RoofSide): Roof {
  if (side < 0 || side >= roof.corners.length) return roof;
  return { ...roof, sides: roofSidesOf(roof).map((each, i) => (i === side ? change(each) : each)) };
}

/** The roof with a person's value for one of its numbers; `undefined` takes the value away. */
function roofWith(
  document: StudioDocument,
  roof: Roof,
  key: RoofNumber,
  value: number | undefined,
  facts: RoofFacts,
): Roof {
  const metres = value === undefined ? undefined : { metres: value, ...PERSON };
  const degrees = value === undefined ? undefined : { degrees: value, ...PERSON };
  const shape = shapeRecordOf(roof, facts);
  switch (key) {
    case 'slope':
      return { ...roof, slope: degrees };
    case 'upper_slope':
      return { ...roof, shape: { ...shape, upperSlope: degrees } };
    case 'break_in':
      return { ...roof, shape: { ...shape, breakIn: metres } };
    case 'teeth':
      return {
        ...roof,
        shape: { ...shape, teeth: value === undefined ? undefined : { count: value, ...PERSON } },
      };
    case 'raised_height':
      return { ...roof, shape: { ...shape, raisedHeight: metres } };
    case 'raised_width':
      return { ...roof, shape: { ...shape, raisedWidth: metres } };
    case 'valley':
      return {
        ...roof,
        shape: {
          ...shape,
          valleyAt: value === undefined ? undefined : { share: value, ...PERSON },
        },
      };
    case 'parapet_height': {
      const parapet = parapetRecordOf(document, roof, facts);
      return value === undefined
        ? { ...roof, parapet: { ...parapet, metres: facts.parapetHeightM, setBy: 'system' } }
        : { ...roof, parapet: { ...parapet, metres: value, ...PERSON } };
    }
    case 'overhang':
      return { ...roof, overhang: metres };
    case 'setback':
      return { ...roof, setback: metres };
    case 'thickness':
      return { ...roof, parapet: { ...parapetRecordOf(document, roof, facts), thickness: metres } };
  }
}

/** A shape record that holds its name and who set it alone; a parapet that holds no more than its height. */
const BARE_SHAPE_KEYS = 2;
const BARE_PARAPET_KEYS = 3;

/** A record with its absent values left out, as a stored one never holds `undefined`. */
export function tidy<T extends object>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T;
}

/**
 * A roof with no empty record left on it: a shape or a parapet that holds only what the studio
 * would give is not stored, so a reset leaves the roof as it was before a person touched it.
 */
export function roofSettled(document: StudioDocument, roof: Roof, facts: RoofFacts): Roof {
  const shape = roof.shape === undefined ? undefined : tidy(roof.shape);
  const bareShape = shape?.setBy === 'system' && Object.keys(shape).length === BARE_SHAPE_KEYS;
  const parapet = roof.parapet === undefined ? undefined : tidy(roof.parapet);
  const start = parapetNow(document, { ...roof, parapet: undefined }, facts);
  const bareParapet =
    parapet?.setBy === 'system' &&
    parapet.allRound === start.allRound &&
    Object.keys(parapet).length === BARE_PARAPET_KEYS;
  return tidy({
    ...roof,
    shape: bareShape ? undefined : shape,
    parapet: bareParapet ? undefined : parapet,
  });
}

function changed(
  document: StudioDocument,
  at: NumberAt,
  value: number | undefined,
  facts: RoofFacts,
): StudioDocument {
  const roof = document.roofs[at.roof];
  if (roof === undefined) return document;
  const { key } = at;
  const side = at.side ?? null;
  const made =
    side !== null && isSideNumber(key)
      ? roofWithSide(roof, side, (held) => tidy({ ...held, [SIDE_FIELD[key]]: value }))
      : roofWith(document, roof, key, value, facts);
  const next = roofSettled(document, made, facts);
  return { ...document, roofs: document.roofs.map((each, i) => (i === at.roof ? next : each)) };
}

/** A person sets a number: slid, typed or dragged. It is kept between the ends typing allows. */
export function roofNumberSet(
  document: StudioDocument,
  at: NumberAt,
  value: number,
  facts: RoofFacts,
): StudioDocument {
  return changed(document, at, roofNumberHeld(at.key, value), facts);
}

/** The reset: the studio's value comes back, or on a side the roof's. */
export function roofNumberReset(
  document: StudioDocument,
  at: NumberAt,
  facts: RoofFacts,
): StudioDocument {
  return changed(document, at, undefined, facts);
}
