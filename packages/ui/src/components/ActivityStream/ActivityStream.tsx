import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider';
import { UnavailableNote } from '../UnavailableNote';
import { applyFilter, filterDimensions } from './ActivityStream.filter';
import { ACTIVITY_KINDS, sortEntries } from './ActivityStream.kinds';
import type { ActivityStreamProps } from './ActivityStream.types';
import { ActivityStreamList } from './ActivityStreamList';
import { StreamMessage, StreamSkeleton } from './ActivityStreamStates';
import { useActivityWindow } from './useActivityWindow';

interface WebActivityStreamProps extends ActivityStreamProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The append-only activity stream (`M02-35` / `SCR-M02-04`). It renders NO filter UI: a kind filter
 * over 13 values is a set, and `FilterSet` / `FacetChips` already ship that — so the stream ships
 * the two pure helpers that build the body and the screen mounts the panel.
 */
export function ActivityStream({
  entries,
  kinds = {},
  total,
  order = 'newest',
  groupBy = 'day',
  visibleCount = 25,
  step = 25,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  filtered = false,
  onClearFilters,
  toolbar,
  countLabel = 'entries',
  todayLabel = 'Today',
  yesterdayLabel = 'Yesterday',
  state = 'ready',
  emptyTitle = 'No activity yet',
  emptyDescription = 'Notes, calls, stage changes and payments all land here as they happen.',
  filteredEmptyTitle = 'Nothing matches these filters',
  filteredEmptyDescription = 'There is activity on this record — none of it is of the kinds you have picked.',
  errorTitle = "Couldn't load the activity",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'No activity is kept here',
  unavailableMessage,
  density = 'expressive',
  className,
  style,
}: WebActivityStreamProps) {
  const format = useFormat();
  const { shown, reveal } = useActivityWindow(entries.length, visibleCount);

  /* Sorted before any early return, and deliberately not memoised: a hook after a conditional
     return changes the hook order between states, which is how a state transition crashes. */
  const sorted = sortEntries(entries, order);
  const circle = {
    '--hg-stream-circle': density === 'functional' ? '32px' : '36px',
  } as CSSProperties;
  const frame = {
    className: classNames('hg-stream', className),
    'data-density': density,
    style: { ...circle, ...style },
  };

  if (state === 'loading') {
    return (
      <div {...frame}>
        <StreamSkeleton />
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div {...frame}>
        <StreamMessage tone="warning" title={errorTitle} message={errorMessage} onRetry={onRetry} />
      </div>
    );
  }
  if (state === 'unavailable') {
    return (
      <div {...frame}>
        <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
      </div>
    );
  }
  /* `timeline-filtered` with nothing in it is NOT "no activity yet" — the record is not empty, the
     filter is narrow, and the sentence has to say which is true or the reader clears the wrong
     thing. The action clears the filters; it never offers to add activity. */
  if (state === 'empty' || entries.length === 0) {
    if (!filtered) {
      return (
        <div {...frame}>
          <StreamMessage title={emptyTitle} message={emptyDescription} />
        </div>
      );
    }
    return (
      <div {...frame}>
        <StreamMessage
          title={filteredEmptyTitle}
          message={filteredEmptyDescription}
          action={
            onClearFilters !== undefined ? (
              <button type="button" className="hg-stream-button" onClick={onClearFilters}>
                Clear filters
              </button>
            ) : null
          }
        />
      </div>
    );
  }

  return (
    <section {...frame}>
      <ActivityStreamList
        sorted={sorted}
        shown={shown}
        reveal={reveal}
        format={format}
        kinds={kinds}
        groupBy={groupBy}
        step={step}
        hasMore={hasMore}
        loadingMore={loadingMore}
        filtered={filtered}
        countLabel={countLabel}
        todayLabel={todayLabel}
        yesterdayLabel={yesterdayLabel}
        density={density}
        total={total}
        onLoadMore={onLoadMore}
        toolbar={toolbar}
      />
    </section>
  );
}

ActivityStream.filterDimensions = filterDimensions;
ActivityStream.applyFilter = applyFilter;
/** The default kind registry, exported so a screen can extend rather than replace it. */
ActivityStream.kinds = ACTIVITY_KINDS;
