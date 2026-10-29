import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { MarketFormat } from '../../utils/format';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';
import type {
  AxisPosition,
  CompareAttribute,
  CompareGridWords,
  CompareOption,
} from './CompareGrid.types';

/** What a grid takes when the caller names nothing — `columnWidth` in the types says what the two
    widths leave at 375px. */
export const COMPARE_GRID_DEFAULTS = {
  columnWidth: 196,
  labelWidth: 128,
  density: 'expressive',
} as const;

/** Whether there is a grid to draw. A state blocks it, and so does having nothing to line up — what
    stands in its place is the state panel's decision, not the shell's. */
export function drawsGrid(
  state: SurfaceState,
  optionCount: number,
  attributeCount: number,
): boolean {
  return state === 'ready' && optionCount > 0 && attributeCount > 0;
}

/** Whether the option axis overflows its track. A few pixels of slack is rounding, not a column. */
export function axisOverflows(contentWidth: number, trackWidth: number): boolean {
  return contentWidth - trackWidth > 4;
}

/** Every second attribute row is tinted, so the eye holds a row across the options. */
export function isZebraRow(index: number): boolean {
  return index % 2 === 1;
}

/** The raw value for one cell: the attribute's own reader, else the option's `values` entry. */
export function rawValue<Opt extends CompareOption>(
  attribute: CompareAttribute<Opt>,
  option: Opt,
): ReactNode | number | undefined {
  if (attribute.value !== undefined) return attribute.value(option);
  return option.values?.[attribute.key];
}

/**
 * **The three shapes an absent cell arrives in**, in one predicate so both platforms agree about
 * which values are a NAMED GAP rather than a value. `0` and `false` are values and are never gaps.
 */
export function isAbsent(raw: ReactNode | number | undefined): boolean {
  return raw === undefined || raw === null || raw === '';
}

/**
 * **What a row's named gap is called, and which edge it hangs off.** The label is the row's own
 * word; *Not stated* is the fallback because it is a statement about the DATA and invents nothing
 * about the option. A numeric row's gap sits where its figures sit, so the column still reads.
 */
export function gapOf<Opt extends CompareOption>(
  attribute: CompareAttribute<Opt>,
  notStated: TranslatedText,
): { gap: TranslatedText; align: 'left' | 'right' } {
  const label = attribute.gapLabel;
  return {
    gap: label === undefined || label === '' ? notStated : label,
    align: attribute.numeric === true ? 'right' : 'left',
  };
}

/**
 * **The best value per row, when the caller has said which direction is better.**
 *
 * Numbers only — a node cannot be compared — and **a tie marks nothing**: picking between two
 * equal values would be a claim the data does not support.
 */
export function bestPerAttribute<Opt extends CompareOption>(
  attributes: CompareAttribute<Opt>[],
  options: Opt[],
): Record<string, string> {
  const best: Record<string, string> = {};
  for (const attribute of attributes) {
    const winner = bestOptionKey(attribute, options);
    if (winner !== null) best[attribute.key] = winner;
  }
  return best;
}

interface Leader {
  value: number;
  key: string;
  tied: boolean;
}

/** The winning option for one row, or null when there is no direction, no number, or a tie. */
function bestOptionKey<Opt extends CompareOption>(
  attribute: CompareAttribute<Opt>,
  options: Opt[],
): string | null {
  const better = attribute.better;
  if (better === undefined) return null;
  let leader: Leader | null = null;
  for (const option of options) {
    const value = rawValue(attribute, option);
    if (typeof value !== 'number' || Number.isNaN(value)) continue;
    if (leader === null || (better === 'higher' ? value > leader.value : value < leader.value)) {
      leader = { value, key: option.key, tied: false };
    } else if (value === leader.value) {
      leader.tied = true;
    }
  }
  return leader === null || leader.tied ? null : leader.key;
}

/**
 * **Whether a cell's value is set as a figure.** AN UNFLAGGED NUMBER IS STILL A FIGURE: a value that
 * arrives as a number is monospaced whether or not the row said so.
 */
export function isMonoCell<Opt extends CompareOption>(
  attribute: CompareAttribute<Opt>,
  raw: ReactNode | number | undefined,
): boolean {
  return attribute.mono === true || attribute.numeric === true || typeof raw === 'number';
}

/** The words of a cell that HAS a value: the pack's formatting of a figure, or the caller's node. */
export function valueWordsOf<Opt extends CompareOption>(
  attribute: CompareAttribute<Opt>,
  raw: ReactNode | number | undefined,
  format: MarketFormat,
): ReactNode {
  if (typeof raw === 'number') return formatNumber(attribute, raw, format);
  return raw;
}

/**
 * **A numeric cell's words**, in the active market's terms.
 *
 * `attribute.format` is the caller's own and always wins. Otherwise the MARKET PACK writes the
 * figure — a `money` row carries the market's currency (compacted when the row asks for it), and
 * every other number takes the pack's locale and grouping. The currency is never invented and
 * never omitted: it is read from `MarketProvider`, which is why the format arrives as a parameter.
 * This module is platform-neutral and cannot call a hook, so the cell that renders reads
 * `useFormat()` and hands the answer down.
 */
export function formatNumber<Opt extends CompareOption>(
  attribute: CompareAttribute<Opt>,
  value: number,
  format: MarketFormat,
): string {
  if (attribute.format !== undefined) return attribute.format(value);
  if (attribute.money === true) {
    return attribute.compact === true ? format.compactMoney(value) : format.money(value);
  }
  return format.number(value, attribute.numberOptions);
}

/**
 * **The footer, or null when it has nothing to hold.** The readout and the previous/next controls
 * appear only while the axis overflows; the footer stays for a caller's `note` alone.
 */
export function axisFootOf(
  position: AxisPosition,
  words: CompareGridWords,
): { readout: TranslatedText | undefined; atFirst: boolean; atLast: boolean } | null {
  if (!position.scrollable && !position.note) return null;
  return {
    readout: positionReadout(position, words),
    atFirst: position.first <= 1,
    atLast: position.last >= position.count,
  };
}

/**
 * **What the footer says about where the reader is on the option axis.**
 *
 * While the axis overflows it names the columns on screen and how to move; once it fits there is
 * nothing left to report, so the line is the caller's `note` alone — the same words on both
 * platforms, which is why they are computed here and not in either half's JSX.
 */
export function positionReadout(
  position: AxisPosition,
  words: CompareGridWords,
): TranslatedText | undefined {
  if (!position.scrollable) return position.note;
  const where =
    position.first === position.last ? `${position.first}` : `${position.first}–${position.last}`;
  return words.position(where, position.count, position.note);
}

/** How many whole option columns the visible track holds, and which ones they are. */
export function visibleRange(
  scrollLeft: number,
  clientWidth: number,
  labelWidth: number,
  columnWidth: number,
  count: number,
): { first: number; last: number } {
  const track = Math.max(1, clientWidth - labelWidth);
  const perView = Math.max(1, Math.round(track / columnWidth));
  const first = Math.min(count, Math.floor(scrollLeft / columnWidth) + 1);
  return { first, last: Math.min(count, first + perView - 1) };
}
