import { Fragment } from 'react';
import type { MarketFormat } from '../../utils/format';
import { dayKey, groupEntries } from './ActivityStream.kinds';
import type { ActivityEntry, ActivityStreamProps } from './ActivityStream.types';
import { StreamEntry } from './ActivityStreamEntry';

export interface ActivityStreamListProps
  extends Required<
      Pick<
        ActivityStreamProps,
        | 'kinds'
        | 'groupBy'
        | 'step'
        | 'hasMore'
        | 'loadingMore'
        | 'filtered'
        | 'countLabel'
        | 'todayLabel'
        | 'yesterdayLabel'
        | 'density'
      >
    >,
    Pick<ActivityStreamProps, 'total' | 'onLoadMore' | 'toolbar'> {
  /** Already sorted; the window is applied here so the count line can state the whole. */
  sorted: ActivityEntry[];
  shown: number;
  reveal: (step: number) => void;
  format: MarketFormat;
}

/**
 * The window, the day grouping and the count line. Nothing is virtualised: a windowed list keeps
 * the DOM small without lying about how many entries exist, and the count always states the whole.
 */
export function ActivityStreamList({
  sorted,
  shown,
  reveal,
  format,
  kinds,
  groupBy,
  step,
  hasMore,
  loadingMore,
  filtered,
  countLabel,
  todayLabel,
  yesterdayLabel,
  density,
  total,
  onLoadMore,
  toolbar,
}: ActivityStreamListProps) {
  const visible = sorted.slice(0, shown);
  const localMore = sorted.length > visible.length;
  const wholeTotal = typeof total === 'number' ? total : sorted.length;
  const groups = groupEntries(visible, groupBy);
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const heading = (key: string, date: Date) => {
    if (key === today) return todayLabel;
    if (key === yesterday) return yesterdayLabel;
    return format.date(date);
  };
  const grouped = (n: number) => format.number(n, { maximumFractionDigits: 0 });
  const remaining = Math.min(step, Math.max(0, wholeTotal - visible.length));
  const countLine =
    visible.length === wholeTotal
      ? `${grouped(wholeTotal)} ${countLabel}`
      : `${grouped(visible.length)} of ${grouped(wholeTotal)} ${countLabel}${
          filtered ? ' match these filters' : ''
        }`;

  return (
    <>
      {toolbar !== undefined || wholeTotal > visible.length || filtered ? (
        <div className="hg-stream-toolbar">
          {/* The count always states the whole, so a window never reads as the total. */}
          <span className="hg-stream-count">{countLine}</span>
          {toolbar}
        </div>
      ) : null}

      <ol className="hg-stream-list">
        {groups.map((group) => (
          <Fragment key={group.key}>
            {groupBy === 'day' && group.key !== 'all' ? (
              <li className="hg-stream-day">{heading(group.key, group.date)}</li>
            ) : null}
            {group.items.map((entry, index) => (
              <StreamEntry
                key={entry.id ?? `${group.key}-${index}`}
                entry={entry}
                kinds={kinds}
                density={density}
                format={format}
              />
            ))}
          </Fragment>
        ))}
      </ol>

      {localMore || hasMore ? (
        <div className="hg-stream-more">
          <button
            type="button"
            className="hg-stream-button"
            data-busy={loadingMore ? 'true' : undefined}
            onClick={() => (localMore ? reveal(step) : onLoadMore?.())}
            disabled={loadingMore}
            aria-label={`Show more activity. ${visible.length} of ${wholeTotal} shown.`}
          >
            {loadingMore ? 'Loading…' : `Show ${remaining === 0 ? step : remaining} more`}
          </button>
        </div>
      ) : null}
    </>
  );
}
