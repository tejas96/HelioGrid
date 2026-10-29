import type { ProvenanceStanding, ProvenanceTier, TranslatedText } from '@heliogrid/contracts';
import type { EnergySource, Freshness } from '@heliogrid/domain';
import type { ReactNode } from 'react';
/**
 * The system's one surface-state vocabulary — `unavailable` is the fourth state: neutral, stated
 * rather than styled as a fault, and NEVER a retry. Imported from the folder that owns it, exactly
 * as the design system's own Charts typings import it from `../feedback/UnavailableNote`, and as
 * sixteen sibling folders here already do.
 */
import type { SurfaceRead } from '../UnavailableNote';

/**
 * A tier: one of `contracts`' four (`F8-02`), or `'unmarked'` — which renders nothing and records
 * that the absence is deliberate. Closed, as `components/Provenance`'s is (`F8-03`).
 *
 * Declared here rather than imported: a chart draws its own provenance line (`ChartProvenance`).
 */
type ProvenanceTierSpec = ProvenanceTier | 'unmarked';

/** The full provenance spec a chart may hand to the line under its headline value. */
interface ProvenanceProps {
  tier?: ProvenanceTierSpec;
  /**
   * The second axis: how far a figure can be relied on as **final**. Orthogonal to the tier —
   * a derived figure from a stale version is still derived, and still must not read as final.
   */
  standing?: ProvenanceStanding;
  /** Whether the figure is still current (`F8-18`), as `QualifiedAmount` carries it. */
  freshness?: Freshness | null;
  /** The energy data the figure was computed from (`F8-08`), as `QualifiedAmount` carries it. */
  energySource?: EnergySource | null;
  /** Any word a caller needs beside the tier (`F8-03`). */
  source?: TranslatedText;
  /** The assumptions a multi-year figure rides on (F8-23 / F5-37). */
  projection?: TranslatedText;
  note?: TranslatedText;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
  align?: 'left' | 'right' | 'center';
  inline?: boolean;
}

/**
 * The words a chart says of its own — its loading name, its empty, too-little and failed notes,
 * its retry, and its plots' names when it has no title — from `packages/i18n`'s `chartWords`. The
 * frame's own `emptyTitle` … `errorMessage` replace one of them for one chart.
 */
export interface ChartWords {
  /** The loading region's name — "Loading chart". */
  loading: TranslatedText;
  emptyTitle: TranslatedText;
  insufficientTitle: TranslatedText;
  insufficientMessage: TranslatedText;
  /** The fourth state's line — "Not available for this scope". */
  unavailableTitle: TranslatedText;
  errorTitle: TranslatedText;
  errorMessage: TranslatedText;
  /** The failed read's *Try again*. */
  retry: TranslatedText;
  /** A funnel's too-little line — it needs two stages, not two periods. */
  funnelInsufficient: TranslatedText;
  /** A donut's too-little line — it needs one value to split. */
  donutInsufficient: TranslatedText;
  /** A plot's accessible name when its chart has no title. */
  lineChart: TranslatedText;
  donutChart: TranslatedText;
  /** A funnel stage's share of the one before — "62% carried forward". */
  carriedForward: (percent: number) => TranslatedText;
}

export interface ChartFrameProps {
  overline?: TranslatedText;
  title?: TranslatedText;
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
  source?: TranslatedText;
  /** Assumptions a multi-year figure rides on (F8-23 / F5-37). */
  projection?: TranslatedText;
  note?: TranslatedText;
  legend?: ReactNode;
  action?: ReactNode;
  /**
   * **Required:** what this draws always comes from a read. `failed` draws the error with its
   * retry; `unavailable` draws none.
   */
  read: SurfaceRead;
  height?: number;
  /** Renders "Not enough data" instead of the plot. Charts set this themselves. */
  insufficient?: boolean;
  /** Every word the chart says of its own; the five below replace one for this chart. */
  words: ChartWords;
  emptyTitle?: TranslatedText;
  /** Drawn under the empty title only when given — `words` holds no empty message. */
  emptyMessage?: TranslatedText;
  insufficientMessage?: TranslatedText;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  children?: ReactNode;
}

export interface ChartDatum {
  // biome-ignore lint/plugin/copy-prop-type: a category of the data — a stage the pack names, a period the format prints
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
  centerLabel?: TranslatedText;
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
  /**
   * Below this carried-forward percentage a stage is called out. REQUIRED, and deliberately not
   * defaulted: a funnel that is doing badly is a product judgement, and this package may hold no
   * policy (`.claude/rules/ui-adherence.md`). A component that invents a threshold promises one
   * thing while its caller means another — the caller passes the number its own module owns.
   */
  lowConversionBelow: number;
}

export interface ChartLegendItem {
  // biome-ignore lint/plugin/copy-prop-type: a series or category of the data, as the caller's data names it
  label: string;
  value?: ReactNode;
  color?: string;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
}
