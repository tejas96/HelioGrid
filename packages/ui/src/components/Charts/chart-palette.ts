/**
 * The chart palette is `--chart-1` … `--chart-8` — ordered and colourblind-safe — plus
 * `--chart-gridline`. **Never invent a colour here.** This module carries only the slot
 * arithmetic, so both platform halves agree on which series lands on which token.
 */

/** How many series slots the palette has before it wraps. */
export const CHART_SLOT_COUNT = 8;

/** The 1-based palette slot (`--chart-N`) a zero-based series index lands on. */
export function chartSlot(index: number): number {
  return (index % CHART_SLOT_COUNT) + 1;
}

/** Evenly spaced tick values from 0 to `max`, for `gridlines` intervals. */
export function chartTicks(max: number, gridlines: number): number[] {
  return Array.from({ length: gridlines + 1 }, (_, i) => (max / gridlines) * i);
}
