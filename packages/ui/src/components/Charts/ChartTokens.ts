import { chartSlot } from './chart-palette';

/**
 * The web half of the chart vocabulary. Colours reach SVG presentation attributes as custom
 * properties — `--chart-1` … `--chart-8` and `--chart-gridline` — because an SVG `stroke` or
 * `fill` cannot come from a stylesheet class when the series index decides it.
 */

/** The palette custom property for a zero-based series index, wrapping at eight. */
export function chartVar(index: number): string {
  return `var(--chart-${chartSlot(index)})`;
}

export const CHART_GRIDLINE_VAR = 'var(--chart-gridline)';
/** The end dot's cut-out: whatever holds the chart, so the ring reads in a tile as on the page. */
export const CHART_GROUND_VAR = 'var(--hg-ground)';
/** The unfilled remainder of a donut ring. */
export const CHART_TRACK_VAR = 'var(--canvas-sunken)';
