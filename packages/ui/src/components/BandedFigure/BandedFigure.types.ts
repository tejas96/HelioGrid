import type { ReactNode } from 'react';
import type { MarketFormat } from '../../utils/format';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';

export type BandTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** The three values a tone resolves to. Web fills them with tokens, native with theme colours. */
export interface BandToneStyle {
  fg: string;
  bg: string;
  mark: string;
}

export interface BandSpec {
  /** **The band's name — the carrier.** "Good", "Fair", "Poor", "Healthy", "Passing", "Fault". */
  label: string;
  tone?: BandTone;
  /**
   * **What to do about it, where the band is a fault** — `M05-64`'s *"shorten the string"*. It lives
   * on the band, not on the host, because a passing band carries none: rendered as a sentence in the
   * figure's own block, never a banner elsewhere on the screen.
   */
  remedy?: ReactNode;
  /** Threshold, in a `bands` table. `min` inclusive, `max` exclusive, either may be omitted. */
  min?: number;
  max?: number;
}

export interface BandedFigureProps {
  label: string;
  value: string | number;
  unit?: string;
  /** Ordered threshold table — the component names the band. First match wins. */
  bands?: BandSpec[];
  /** A resolved band, when the caller has already decided. Wins over `bands`. */
  band?: BandSpec | string;
  /** Overrides the band's own remedy. */
  remedy?: ReactNode;
  /** The rule the figure is read against — "Maximum system voltage · 1000 V · IEC 62548". */
  bound?: ReactNode;
  /**
   * `line` — figure and band in a row, inside a panel. `card` (default) — the standalone block.
   * `box` — `M05-64`'s prominent compliance box, *"the figure an electrical inspector checks"*.
   */
  variant?: 'line' | 'card' | 'box';
  provenance?: ProvenanceProps | ProvenanceTierSpec | ReactNode;
  note?: ReactNode;
  compact?: boolean;
  money?: boolean;
  ariaLabel?: string;
  children?: ReactNode;
}

/**
 * Picks the band a value falls in. `min` inclusive, `max` exclusive; an omitted bound is open and
 * the first match wins, so an ordered table reads top-to-bottom like the brief writes it.
 */
export function resolveBand(
  value: number | string,
  bands?: BandSpec[],
  explicit?: BandSpec | string,
): BandSpec | null {
  if (explicit !== undefined) {
    if (typeof explicit === 'string') return { label: explicit, tone: 'neutral' };
    return { tone: 'neutral', ...explicit };
  }
  const numeric = Number(value);
  if (!Array.isArray(bands) || !Number.isFinite(numeric)) return null;
  const hit = bands.find(
    (band) =>
      (band.min === undefined || numeric >= band.min) &&
      (band.max === undefined || numeric < band.max),
  );
  return hit !== undefined ? { tone: 'neutral', ...hit } : null;
}

/** The figure as the market pack prints it. Strings pass through — they are already words. */
export function formatFigure(
  value: string | number,
  format: MarketFormat,
  options: { money: boolean; compact: boolean },
): string {
  if (typeof value !== 'number') return value;
  if (options.money) return options.compact ? format.compactMoney(value) : format.money(value);
  if (options.compact) return format.compact(value);
  return format.number(value, { maximumFractionDigits: 2 });
}

/** aria carries the word, not the tint: the band is read out as part of the figure. */
export function bandedReadOut(
  label: string,
  shown: string,
  unit: string | undefined,
  band: BandSpec | null,
  move: ReactNode,
): string {
  const parts = [
    label,
    `${shown}${unit !== undefined ? ` ${unit}` : ''}`,
    band?.label,
    typeof move === 'string' ? move : null,
  ];
  return parts
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(' — ');
}
