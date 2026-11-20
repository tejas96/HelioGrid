import { METRES_PER_FOOT } from '../format/measurement';
import type { MeasurementSystem } from '../format/pack';

/** The lengths a scale bar may show, in the reader's own unit: round numbers only. */
const ROUND_METRES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000] as const;
const ROUND_FEET = [5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000] as const;

export interface ScaleBar {
  /** The length the bar stands for, in metres. */
  readonly metres: number;
  /** How long the bar is drawn, in screen pixels. */
  readonly pixels: number;
}

/**
 * A map's scale bar: the longest round length — metres, or feet — that fits in `maxPixels` at the
 * ground shown now; `null` when even the shortest does not fit.
 */
export function scaleBarOf(
  metresPerPixel: number,
  system: MeasurementSystem,
  maxPixels: number,
): ScaleBar | null {
  if (!(metresPerPixel > 0) || !(maxPixels > 0)) return null;
  const lengths =
    system === 'imperial'
      ? ROUND_FEET.map((feet) => feet * METRES_PER_FOOT)
      : ROUND_METRES.map((metres) => metres);
  const fits = lengths.filter((metres) => metres / metresPerPixel <= maxPixels);
  const metres = fits.at(-1);
  return metres === undefined ? null : { metres, pixels: metres / metresPerPixel };
}
