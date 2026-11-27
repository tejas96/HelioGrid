import { formatNumber } from './number';
import type { FormatPack, MeasurementSystem } from './pack';

/**
 * The ONE measurement implementation (`F3-19`, `F3-23`).
 *
 * The unit symbol is never translated and never separates from its value (`F3-08`) — `4.2 m`
 * reads `4.2 m` in Marathi, joined by a non-breaking space so a narrow card cannot split it.
 */

/**
 * Procurement, BOM and supplier-facing quantities are metric for EVERY user, whatever their
 * preference says (`F3-23`). It is a constant rather than a parameter because there is no
 * caller that may vary it: a supplier order in feet is a wrong order.
 */
export const PROCUREMENT_SYSTEM: MeasurementSystem = 'metric';

export const METRES_PER_FOOT = 0.3048;
/** NON-BREAKING: `F3-08` forbids a value and its unit separating across a line. */
const NBSP = ' ';

/**
 * The system a reader sees — their own preference where they have one, else the market's
 * default (`F1-50`). Pass `PROCUREMENT_SYSTEM` instead on any supplier-facing quantity.
 */
export function resolveMeasurementSystem(
  pack: FormatPack,
  preference?: MeasurementSystem,
): MeasurementSystem {
  return preference ?? pack.measurementSystem;
}

/**
 * A length held in METRES, rendered in the reader's system. Storage stays metric always, so
 * the preference is a rendering decision and never reaches a stored value.
 */
export function formatLength(
  pack: FormatPack,
  metres: number,
  system: MeasurementSystem = pack.measurementSystem,
): string {
  const imperial = system === 'imperial';
  const value = imperial ? metres / METRES_PER_FOOT : metres;
  return `${formatNumber(pack, value, { maximumFractionDigits: 1 })}${NBSP}${imperial ? 'ft' : 'm'}`;
}

const CENTIMETRES_PER_METRE = 100;
const INCHES_PER_METRE = 1 / 0.0254;

/**
 * A short length held in METRES — a picture's sharpness, a gap — in the reader's system: whole
 * centimetres, or inches to one decimal.
 */
export function formatFineLength(
  pack: FormatPack,
  metres: number,
  system: MeasurementSystem = pack.measurementSystem,
): string {
  if (system === 'imperial') {
    const inches = formatNumber(pack, metres * INCHES_PER_METRE, { maximumFractionDigits: 1 });
    return `${inches}${NBSP}in`;
  }
  const centimetres = formatNumber(pack, metres * CENTIMETRES_PER_METRE, {
    maximumFractionDigits: 0,
  });
  return `${centimetres}${NBSP}cm`;
}

const INCHES_PER_FOOT = 12;
const SQUARE_FEET_PER_SQUARE_METRE = 1 / (METRES_PER_FOOT * METRES_PER_FOOT);
/** Before a length read off a picture: it is about this long (`T-M05-002`). Never translated. */
const ABOUT = '~';

/** A length in whole feet and whole inches, the inches rounded and never 12. */
export function feetAndInches(metres: number): { feet: number; inches: number } {
  const inches = Math.round(metres * INCHES_PER_METRE);
  return { feet: Math.floor(inches / INCHES_PER_FOOT), inches: inches % INCHES_PER_FOOT };
}

/** Feet and inches as a person types them in two boxes, held in metres. */
export function metresOfFeetAndInches(feet: number, inches: number): number {
  return (feet * INCHES_PER_FOOT + inches) / INCHES_PER_METRE;
}

/**
 * A roof edge's length (`T-M05-002`): to the centimetre, every length on the roof step alike — set
 * by a person, `8.20 m`, as the box holds it; read off the picture, `~7.84 m`, its "~" alone saying
 * it is about. One digit count, so a label, the length card and the typed preview never disagree
 * (`~29.0` beside `28.98`). In feet, `26 ft 11 in` either way: a tape in feet reads whole inches.
 */
export function formatRoofLength(
  pack: FormatPack,
  metres: number,
  system: MeasurementSystem,
  traced: boolean,
): string {
  const about = traced ? ABOUT : '';
  if (system === 'imperial') {
    const { feet, inches } = feetAndInches(metres);
    return `${about}${formatNumber(pack, feet)}${NBSP}ft ${formatNumber(pack, inches)}${NBSP}in`;
  }
  const value = formatNumber(pack, metres, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${about}${value}${NBSP}m`;
}

/**
 * A roof's height (`T-M05-002`): `3.0 m` — slid in 10 cm steps, so to the decimetre, and to the
 * centimetre when typed so (`3.25 m`) — or in whole feet and inches.
 */
export function formatRoofHeight(
  pack: FormatPack,
  metres: number,
  system: MeasurementSystem,
): string {
  if (system === 'imperial') return formatRoofLength(pack, metres, system, false);
  // A height typed to the centimetre shows its centimetres: what is stored is what is shown.
  const value = formatNumber(pack, metres, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  return `${value}${NBSP}m`;
}

/** A pitch's run: a slope is said as its rise over this many inches across. */
const PITCH_RUN_IN = 12;
const RADIANS = Math.PI / 180;

/**
 * A roof's slope in the reader's system (`T-M05-002`, part e): degrees, `30°`; where feet are used,
 * its rise in 12 with the degrees beside it, `3/12 · 14°`.
 */
export function formatRoofSlope(
  pack: FormatPack,
  degrees: number,
  system: MeasurementSystem,
): string {
  const angle = `${formatNumber(pack, degrees, { maximumFractionDigits: 1 })}°`;
  if (system !== 'imperial') return angle;
  const rise = PITCH_RUN_IN * Math.tan(degrees * RADIANS);
  return `${formatNumber(pack, rise, { maximumFractionDigits: 1 })}/${PITCH_RUN_IN} · ${angle}`;
}

/** An area as `formatArea` shows it — whole square feet or whole square metres — in square metres. */
export function areaShownM2(squareMetres: number, system: MeasurementSystem): number {
  if (system === 'imperial') {
    return Math.round(squareMetres * SQUARE_FEET_PER_SQUARE_METRE) / SQUARE_FEET_PER_SQUARE_METRE;
  }
  return Math.round(squareMetres);
}

/** An area held in square metres, whole, in the reader's system: `66 m²`, `706 sq ft`. */
export function formatArea(
  pack: FormatPack,
  squareMetres: number,
  system: MeasurementSystem,
): string {
  if (system === 'imperial') {
    const feet = formatNumber(pack, squareMetres * SQUARE_FEET_PER_SQUARE_METRE, {
      maximumFractionDigits: 0,
    });
    return `${feet}${NBSP}sq ft`;
  }
  return `${formatNumber(pack, squareMetres, { maximumFractionDigits: 0 })}${NBSP}m²`;
}
