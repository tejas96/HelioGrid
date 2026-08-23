import type { ReactNode } from 'react';
/**
 * The system's one surface-state vocabulary — `unavailable` is the fourth state: neutral, stated
 * rather than styled as a fault, and NEVER a retry. Imported from the folder that owns it, exactly
 * as the design system's own Charts typings import it from `../feedback/UnavailableNote`, and as
 * sixteen sibling folders here already do.
 */
import type { SurfaceState } from '../UnavailableNote';

/**
 * The four canonical provenance tiers. **Not a closed set** — any string is a valid tier.
 */
type ProvenanceTierName = 'measured' | 'derived' | 'estimated' | 'assumed';

/**
 * A tier. Either a canonical name, any free word (`'Verified datasheet'`), an object that
 * borrows a canonical mark colour, or the reserved `'unmarked'` — which renders nothing and
 * *records that the absence is deliberate*, as distinct from having forgotten.
 *
 * NOT the same type as `components/Provenance`'s `ProvenanceTierSpec`, and the difference is
 * `color`. The design system contract types it `color?: string` — a CSS colour value, painted
 * straight onto the dot (`data/Provenance.jsx`: `background: color`), which is what
 * `chart-provenance.ts` carries through as `customColor`. `components/Provenance` deliberately
 * NARROWED that field to a DS colour **token name** so no raw colour can enter through a caller's
 * tier object. Importing it here would both reject `color: '#1F5FA9'` (legal under the contract)
 * and paint `color: 'success-text'` as a literal CSS colour, which renders no dot at all. Merging
 * the two is a real change to Charts' provenance renderer, not an import — see the port notes.
 */
type ProvenanceTierSpec =
  | ProvenanceTierName
  | 'unmarked'
  | string
  | { label: string; tone?: ProvenanceTierName; color?: string };

/**
 * The second axis: how far a figure can be relied on as **final**. Orthogonal to the tier —
 * a derived figure from a stale version is still derived, and still must not read as final.
 */
type ProvenanceStanding = 'confirmed' | 'provisional' | 'reported' | 'pending';

/** The full provenance spec a chart may hand to the line under its headline value. */
interface ProvenanceProps {
  tier?: ProvenanceTierSpec;
  standing?: ProvenanceStanding;
  /** What data it came from — `'Real · PVGIS (SARAH3)'` (M05-54). */
  source?: string;
  /** The assumptions a multi-year figure rides on (F8-23 / F5-37). */
  projection?: string;
  note?: string;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
  align?: 'left' | 'right' | 'center';
  inline?: boolean;
}

export interface ChartFrameProps {
  overline?: string;
  title?: string;
  /**
   * Headline figure above the plot. **Format it through the market pack**, not with a baked-in
   * rupee string: `const mkt = useFormat()` → `value={mkt.money(12400000)}`. A literal
   * `"₹1,24,00,000"` is an India-only chart (`F1` / `F3-20`).
   */
  value?: ReactNode;
  /**
   * Provenance for the numbers in this chart — a **visible word** under the value (F8-07), never
   * a dot alone. Required on anything user-facing (F8-01). Takes a bare tier or a full spec.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  /** How far the figure can be relied on as final. See `Provenance`. */
  standing?: ProvenanceStanding;
  /** What data it came from — "Real · PVGIS (SARAH3)" (M05-54). Kept separate from the tier. */
  source?: string;
  /** Assumptions a multi-year figure rides on (F8-23 / F5-37). */
  projection?: string;
  note?: string;
  legend?: ReactNode;
  action?: ReactNode;
  state?: SurfaceState;
  height?: number;
  /** Renders "Not enough data" instead of the plot. Charts set this themselves. */
  insufficient?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  insufficientMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface LinePoint {
  x: string | number;
  y: number;
}

export interface LineSeries {
  name?: string;
  color?: string;
  points: LinePoint[];
}

export interface BarChartProps extends Omit<ChartFrameProps, 'children' | 'insufficient'> {
  data: ChartDatum[];
  /**
   * **An override, not the source of formatting.** Omit it and the axis/labels use the active
   * market pack's `number` (`useFormat().number` — the India pack outside a provider). Pass it
   * only when this chart's figures need something the pack does not say: money (`mkt.money`), a
   * unit (`n => n+" kWh"`), a percentage. Never to hardcode a currency — that is what the pack is
   * for (`F1` / `F3-20`).
   */
  format?: (n: number) => string;
  /** Below this many values the chart refuses to draw. Default 1. */
  minPoints?: number;
  color?: string;
  gridlines?: number;
  /** Horizontal bars — better for long category names on a phone. */
  horizontal?: boolean;
}

export interface LineChartProps extends Omit<ChartFrameProps, 'children' | 'insufficient'> {
  /** One or more series; a bare LinePoint[] is treated as a single series. */
  series: LineSeries[] | LinePoint[];
  /** Override for the pack's `number` — see `BarChartProps.format`. */
  format?: (n: number) => string;
  /** Default 2 — a single point cannot show a trend. */
  minPoints?: number;
  area?: boolean;
  gridlines?: number;
}

export interface DonutChartProps extends Omit<ChartFrameProps, 'children' | 'insufficient'> {
  data: ChartDatum[];
  size?: number;
  thickness?: number;
  /** Override for the pack's `number` — see `BarChartProps.format`. */
  format?: (n: number) => string;
  centerLabel?: string;
  /**
   * The centred total. Format it through the pack — `mkt.compactMoney(12400000)`, not "₹1.24 Cr".
   */
  centerValue?: ReactNode;
  minPoints?: number;
}

export interface FunnelChartProps extends Omit<ChartFrameProps, 'children' | 'insufficient'> {
  stages: ChartDatum[];
  /** Override for the pack's `number` — see `BarChartProps.format`. */
  format?: (n: number) => string;
  /** Default 2 — a funnel needs at least two stages. */
  minPoints?: number;
}

export interface ChartLegendItem {
  label: string;
  value?: ReactNode;
  color?: string;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
}
