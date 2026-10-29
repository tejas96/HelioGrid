import type { ReactNode } from 'react';
import type { ChartDatum } from './Charts.types';
import { chartTicks } from './chart-palette';

/** One ring segment: its share of the circumference and where along the ring it starts. */
export interface DonutSegment {
  datum: ChartDatum;
  index: number;
  length: number;
  offset: number;
}

export interface DonutDrawing {
  total: number;
  /** Below `minPoints` positive values, or with nothing to total, the frame says so instead. */
  insufficient: boolean;
  radius: number;
  circumference: number;
  segments: DonutSegment[];
}

/** The donut's whole arithmetic: the total, the ring and each segment laid end to end. */
export function donutDrawing(
  data: ChartDatum[],
  size: number,
  thickness: number,
  minPoints: number,
): DonutDrawing {
  const total = data.reduce((n, d) => n + (d.value || 0), 0);
  const insufficient = data.filter((d) => d.value > 0).length < minPoints || total <= 0;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.map((datum, index) => {
    const length = ((datum.value || 0) / (total || 1)) * circumference;
    const segment = { datum, index, length, offset };
    offset += length;
    return segment;
  });
  return { total, insufficient, radius, circumference, segments };
}

/** The figure in the ring's middle: the caller's own, or the formatted total. */
export function donutCentre(
  centerValue: ReactNode,
  total: number,
  format: (n: number) => string,
): ReactNode {
  return centerValue ?? format(total);
}

/** The legend beside a chart: each datum's label and colour, and its value formatted. */
export function chartLegendItems(data: ChartDatum[], format: (n: number) => string) {
  return data.map((d) => ({ label: d.label, color: d.color, value: format(d.value) }));
}

export interface BarScale {
  /**
   * Honesty is a product law: below `minPoints` real values the frame says so instead of drawing
   * a confident-looking bar. A value that is not a real number is not a real value.
   */
  insufficient: boolean;
  max: number;
  ticks: number[];
  /** The gap between columns, from the measured width: a sixth of a slot, held to 4–16. */
  gap: number;
}

export function barScale(
  data: ChartDatum[],
  minPoints: number,
  gridlines: number,
  width: number,
): BarScale {
  const real = data.filter((d) => typeof d.value === 'number' && !Number.isNaN(d.value));
  const max = Math.max(1, ...data.map((d) => d.value || 0));
  const rawGap = width / (data.length * 6);
  return {
    insufficient: real.length < minPoints,
    max,
    ticks: chartTicks(max, gridlines),
    gap: Math.max(4, Math.min(16, Number.isFinite(rawGap) && rawGap !== 0 ? rawGap : 8)),
  };
}

/** A bar's length as a percentage of the scale. */
export function barPercent(datum: ChartDatum, max: number): number {
  return ((datum.value || 0) / max) * 100;
}

/** The funnel's frame: enough stages to compare, the widest stage, and a row's worth of height each. */
export function funnelScale(
  stages: ChartDatum[],
  minPoints: number,
): { insufficient: boolean; top: number; height: number } {
  return {
    insufficient: stages.length < minPoints,
    top: Math.max(1, ...stages.map((s) => s.value || 0)),
    height: Math.max(160, stages.length * 56),
  };
}

export interface FunnelStageDrawing {
  widthPercent: number;
  opacity: number;
  conversion: number | null;
}

/**
 * One stage's bar — never thinner than 2%, each stage a shade lighter than the last — and the
 * share carried forward from the stage before it, which the first stage, or one after a stage of
 * nothing, does not have.
 */
export function funnelStage(stages: ChartDatum[], index: number, top: number): FunnelStageDrawing {
  const stage = stages[index];
  const value = stage === undefined ? 0 : stage.value || 0;
  const previous = index > 0 ? (stages[index - 1]?.value ?? 0) : 0;
  return {
    widthPercent: Math.max(2, (value / top) * 100),
    opacity: 1 - index * 0.13,
    conversion: previous ? Math.round((value / previous) * 100) : null,
  };
}
