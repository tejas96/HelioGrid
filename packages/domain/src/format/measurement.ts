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
