import { theme } from '@heliogrid/theme';

/**
 * Where a rising row stands in its list's stagger: the theme's step for each of the first rows,
 * and every later row with the last of them, so a long list never arrives one row at a time.
 */
export function riseOrder(index: number): number {
  return Math.min(index, theme.motion.stagger.maxItems);
}

/** A sentence cut around the figure it holds, so the figure can be set in its own face. */
export interface AroundFigure {
  readonly lead: string;
  readonly figure: string;
  readonly trail: string;
}

/**
 * A sentence the translator built around a figure, cut where the figure fell — before the words in
 * English, after them in Hindi and Marathi. A sentence that does not hold the figure is all lead.
 */
export function aroundFigure(sentence: string, figure: string): AroundFigure {
  const at = figure === '' ? -1 : sentence.indexOf(figure);
  if (at < 0) return { lead: sentence, figure: '', trail: '' };
  return {
    lead: sentence.slice(0, at),
    figure,
    trail: sentence.slice(at + figure.length),
  };
}

/** How tall the tallest month's bar stands in its column, in percent: room is kept for its figure. */
const TALLEST_BAR_PERCENT = 86;

export interface MonthBar {
  /** The bar's height, in percent of its column. */
  readonly height: number;
  readonly peak: boolean;
}

/** Each month's bar against the best month, which the caller names (`bestMonth`). */
export function monthBars(monthly: readonly number[], peak: number): readonly MonthBar[] {
  const max = Math.max(0, ...monthly);
  return monthly.map((value, index) => ({
    height: max > 0 ? (value / max) * TALLEST_BAR_PERCENT : 0,
    peak: index === peak,
  }));
}

/** A bill bar's width against today's bill, in percent — never so thin that it cannot be seen. */
export function billShare(bill: number, today: number): number {
  if (!(today > 0)) return 0;
  return Math.min(100, Math.max((bill / today) * 100, 3));
}

/** The payback curve's drawing box, in its own units. */
export const PAYBACK_BOX = { width: 520, height: 150 } as const;

export interface PaybackGeometry {
  /** The savings curve, as `x,y` pairs. */
  readonly curvePoints: string;
  /** The wash under it, closed along the foot. */
  readonly washPoints: string;
  /** The net cost's height on the plot. */
  readonly netY: number;
  /** Where the savings pass the net cost; `null` where they never do. */
  readonly crossX: number | null;
}

/**
 * The savings curve against the net cost, both in one unit. `null` while there is no horizon to
 * draw — fewer than two years, or nothing saved.
 */
export function paybackGeometry(
  cumulative: readonly number[],
  netCost: number,
  paybackYears: number | null,
): PaybackGeometry | null {
  const top = cumulative[cumulative.length - 1] ?? 0;
  if (cumulative.length < 2 || !(top > 0)) return null;
  const { width, height } = PAYBACK_BOX;
  const lastYear = cumulative.length - 1;
  const x = (year: number) => (Math.min(Math.max(year, 0), lastYear) / lastYear) * width;
  const y = (value: number) => height - (Math.min(Math.max(value, 0), top) / top) * height;
  const curvePoints = cumulative
    .map((value, year) => `${x(year).toFixed(1)},${y(value).toFixed(1)}`)
    .join(' ');
  return {
    curvePoints,
    washPoints: `${curvePoints} ${width},${height} 0,${height}`,
    netY: y(netCost),
    /* Year one is the curve's first point, so a payback of n years lands on point n − 1. */
    crossX: paybackYears === null ? null : x(paybackYears - 1),
  };
}

/** A brand's letter for its small mark. */
export function brandLetter(name: string): string {
  return name.trim().slice(0, 1).toUpperCase();
}

/** The plan's parts a sheet prints, each with its place in the whole plan (its colour follows it). */
export function slicedParts<Part>(
  parts: readonly Part[],
  slice: { readonly from: number; readonly to: number } | undefined,
): readonly { readonly part: Part; readonly index: number }[] {
  const from = slice?.from ?? 0;
  return parts
    .slice(from, slice?.to ?? parts.length)
    .map((part, offset) => ({ part, index: from + offset }));
}
