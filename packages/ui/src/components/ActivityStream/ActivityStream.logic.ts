import type { TranslatedText } from '@heliogrid/contracts';
import type { MarketFormat } from '../../utils/format';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';
import type { ActivityGroup } from './ActivityStream.kinds';
import { asDate, dayKey, groupEntries, hhmm, isValidDate } from './ActivityStream.kinds';
import type {
  ActivityEntry,
  ActivityStreamListProps,
  ActivityStreamProps,
} from './ActivityStream.types';

/** What a stream takes when the caller names nothing: the window opens at 25 and grows by 25. */
export const ACTIVITY_STREAM_DEFAULTS = {
  order: 'newest',
  groupBy: 'day',
  visibleCount: 25,
  step: 25,
  density: 'expressive',
} as const;

/** The loading form's shape: four entry-shaped rows of three lines, so the stream keeps its shape
    while its content is coming. Widths and heights are per-line measurements, not scale steps. */
export const STREAM_SKELETON = {
  rows: ['a', 'b', 'c', 'd'],
  lines: [
    { key: 'kind', width: '34%', height: 11 },
    { key: 'summary', width: '76%', height: 14 },
    { key: 'actor', width: '28%', height: 11 },
  ],
} as const;

/** The kind mark's circle and the glyph inside it, at the stream's density. */
export function streamMarkOf(density: NonNullable<ActivityStreamProps['density']>): {
  circle: number;
  glyph: number;
} {
  return density === 'functional' ? { circle: 32, glyph: 15 } : { circle: 36, glyph: 17 };
}

/** An entry's clock in the market's style, or null when its time cannot be read. */
export function entryClockOf(entry: ActivityEntry, format: MarketFormat): string | null {
  const date = asDate(entry.at);
  return isValidDate(date) ? format.time(hhmm(date)) : null;
}

/** What stands in the stream's frame: a read's state, one of the two empties, or the list. */
export type StreamStage = 'loading' | 'error' | 'unavailable' | 'empty' | 'filtered-empty' | 'list';

/**
 * **Which stage the stream is in.** A filtered stream with nothing in it is NOT "no activity yet" —
 * the record is not empty, the filter is narrow, and the sentence has to say which is true or the
 * reader clears the wrong thing. Its act clears the filters; it never offers to add activity.
 */
export function streamStageOf(
  state: SurfaceState,
  entryCount: number,
  filtered: boolean,
): StreamStage {
  if (state === 'loading' || state === 'error' || state === 'unavailable') return state;
  if (state === 'empty' || entryCount === 0) return filtered ? 'filtered-empty' : 'empty';
  return 'list';
}

/** One group of the window, with the day heading it is drawn under — or none. */
export interface HeadedGroup extends ActivityGroup {
  // biome-ignore lint/plugin/copy-prop-type: the catalog's Today or Yesterday, else the day's date in the pack's style
  heading: string | null;
}

/** What the list draws for the window it holds. */
export interface StreamWindow {
  groups: HeadedGroup[];
  /** The count always states the whole, so a window never reads as the total. */
  countLine: TranslatedText;
  /** The count's bar: the caller's toolbar, a window short of the whole, or a filter in force. */
  showsToolbar: boolean;
  /** *Show more*: entries already here wait behind the window, or the caller has another page. */
  showsMore: boolean;
  /** The next press reveals entries already here; otherwise it asks the caller for a page. */
  revealsLocally: boolean;
  moreLabel: TranslatedText;
}

/**
 * **The window, the day grouping and the count line**, computed once so both halves count alike.
 * Nothing is virtualised: a windowed list stays small without lying about how many entries exist.
 */
export function streamWindowOf(list: ActivityStreamListProps): StreamWindow {
  const { sorted, shown, total, groupBy, step, filtered, words, format } = list;
  const visible = sorted.slice(0, shown);
  const revealsLocally = sorted.length > visible.length;
  const wholeTotal = typeof total === 'number' ? total : sorted.length;
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const headingOf = (group: ActivityGroup): string | null => {
    if (groupBy !== 'day' || group.key === 'all') return null;
    if (group.key === today) return list.todayLabel;
    if (group.key === yesterday) return list.yesterdayLabel;
    return format.date(group.date);
  };
  const grouped = (n: number) => format.number(n, { maximumFractionDigits: 0 });
  const remaining = Math.min(step, Math.max(0, wholeTotal - visible.length));
  return {
    groups: groupEntries(visible, groupBy).map((group) => ({
      ...group,
      heading: headingOf(group),
    })),
    countLine:
      visible.length === wholeTotal
        ? words.count(grouped(wholeTotal), list.countLabel)
        : words.countOf(grouped(visible.length), grouped(wholeTotal), list.countLabel, filtered),
    showsToolbar: list.toolbar !== undefined || wholeTotal > visible.length || filtered,
    showsMore: revealsLocally || list.hasMore,
    revealsLocally,
    moreLabel: list.loadingMore
      ? words.loadingMore
      : words.showMore(remaining === 0 ? step : remaining),
  };
}
