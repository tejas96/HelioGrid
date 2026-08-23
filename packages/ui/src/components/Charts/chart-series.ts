import type { LinePoint, LineSeries } from './Charts.types';

/** A bare `LinePoint[]` is treated as a single unnamed series. */
export function toLineSeries(series: LineSeries[] | LinePoint[]): LineSeries[] {
  const first = series[0];
  if (first === undefined) {
    return [];
  }
  if ('points' in first) {
    return series as LineSeries[];
  }
  return [{ name: '', points: series as LinePoint[] }];
}

export interface LineGeometry {
  /** Plot width in viewBox units. */
  width: number;
  /** Plot height in viewBox units — the frame height less the axis strip. */
  height: number;
  pad: number;
  x(index: number, count: number): number;
  y(value: number): number;
}

/**
 * The plot's coordinate space. The domain floor is pinned at 0 rather than at the smallest
 * value, so a series that only wobbles never reads as a collapse.
 */
export function lineGeometry(
  sets: LineSeries[],
  measured: number,
  frameHeight: number,
): LineGeometry {
  const all = sets.flatMap((s) => s.points.map((p) => p.y));
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  const width = Math.max(240, measured || 320);
  const height = frameHeight - 24;
  const pad = 6;
  return {
    width,
    height,
    pad,
    x: (index, count) => pad + (index * (width - pad * 2)) / Math.max(1, count - 1),
    y: (value) => height - ((value - min) / (max - min || 1)) * (height - 8) - 4,
  };
}

/** The longest series decides whether there is enough data to show a trend at all. */
export function longestSeries(sets: LineSeries[]): number {
  return Math.max(0, ...sets.map((s) => s.points.length));
}
