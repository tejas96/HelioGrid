import type { MeasurementSystem, RoofNumberShown } from '@heliogrid/domain';
import type { MarketFormat } from '@heliogrid/ui';

/** A share of the roof's width, shown in per cent. */
const PERCENT = 100;

/**
 * A sheet's number as it reads (`T-M05-002`, part e): a length as a roof's height reads, a slope in
 * degrees — rise in 12 where feet are used — a valley's place in per cent, a count as it is.
 */
export function numberShownBy(format: MarketFormat, units: MeasurementSystem) {
  return (shown: Pick<RoofNumberShown, 'unit' | 'value'>): string => {
    switch (shown.unit) {
      case 'metres':
        return format.roofHeight(shown.value, units);
      case 'degrees':
        return format.roofSlope(shown.value, units);
      case 'share':
        // A share of the roof's width: a figure and its sign, never a word.
        return `${format.number(Math.round(shown.value * PERCENT))}%`;
      case 'count':
        return format.number(shown.value);
    }
  };
}
