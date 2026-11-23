import type { MeasurementSystem } from '@heliogrid/domain';
import type { RoofWordsShown } from '@heliogrid/i18n';
import type { useFormat } from '@heliogrid/ui';

/** How the roof words show a length and a height, in the reader's units: one place for both. */
export function roofWordsShown(
  format: ReturnType<typeof useFormat>,
  units: MeasurementSystem,
  /** The height a roof on the ground starts at, which the line after a close names. */
  startHeightM: number,
): RoofWordsShown {
  return {
    length: (metres) => format.roofLength(metres, units, false),
    height: format.roofHeight(startHeightM, units),
    heightOf: (metres) => format.roofHeight(metres, units),
  };
}
