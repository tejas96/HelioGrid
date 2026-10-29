import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { closingPress } from '../../primitives/FocusAfter';
import { Button } from '../Button/Button';
import { useFormat } from '../MarketProvider';
import { UnavailableNote } from '../UnavailableNote';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { applyFilter, filterDimensions } from './ActivityStream.filter';
import { ACTIVITY_KINDS, sortEntries } from './ActivityStream.kinds';
import { ACTIVITY_STREAM_DEFAULTS, streamMarkOf, streamStageOf } from './ActivityStream.logic';
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
  order = ACTIVITY_STREAM_DEFAULTS.order,
  groupBy = ACTIVITY_STREAM_DEFAULTS.groupBy,
  visibleCount = ACTIVITY_STREAM_DEFAULTS.visibleCount,
  step = ACTIVITY_STREAM_DEFAULTS.step,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  filtered = false,
  onClearFilters,
  toolbar,
  countLabel,
  todayLabel,
  yesterdayLabel,
  read,
  emptyTitle,
  emptyDescription,
  filteredEmptyTitle,
  filteredEmptyDescription,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  density = ACTIVITY_STREAM_DEFAULTS.density,
  words,
  className,
  style,
}: WebActivityStreamProps) {
  const stage = streamStageOf(surfaceStateOf(read), entries.length, filtered);
  const onRetry = retryOf(read);
  const format = useFormat();
  const { shown, reveal } = useActivityWindow(entries.length, visibleCount);
  /* The stream's own frame in every state but `ready`: a failed read reloads into it, so *Try
     again* hands focus to it. */
  const holder = useRef<HTMLDivElement>(null);

  /* Sorted before any early return, and deliberately not memoised: a hook after a conditional
     return changes the hook order between states, which is how a state transition crashes. */
  const sorted = sortEntries(entries, order);
  const circle = { '--hg-stream-circle': `${streamMarkOf(density).circle}px` } as CSSProperties;
  const frame = {
    className: classNames('hg-stream', className),
    'data-density': density,
    style: { ...circle, ...style },
  };
  const stateFrame = {
    ...frame,
    className: classNames('hg-stream', 'hg-focus-target', className),
    ref: holder,
    tabIndex: -1,
  };

  if (stage === 'loading') {
    return (
      <div {...stateFrame}>
        <StreamSkeleton label={words.loading} />
      </div>
    );
  }
  if (stage === 'error') {
    return (
      <div {...stateFrame}>
        <StreamMessage
          tone="warning"
          title={errorTitle}
          message={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={holder}
        />
      </div>
    );
  }
  if (stage === 'unavailable') {
    return (
      <div {...stateFrame}>
        <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
      </div>
    );
  }
  if (stage === 'empty') {
    return (
      <div {...stateFrame}>
        <StreamMessage title={emptyTitle} message={emptyDescription} focusAfter={holder} />
      </div>
    );
  }
  /* `timeline-filtered`: the act clears the filters; it never offers to add activity. */
  if (stage === 'filtered-empty') {
    return (
      <div {...stateFrame}>
        <StreamMessage
          title={filteredEmptyTitle}
          message={filteredEmptyDescription}
          focusAfter={holder}
          action={
            /* Clearing takes the filtered-empty state away: focus goes to the stream that stays. */
            onClearFilters !== undefined ? (
              <Button variant="secondary" size="md" onClick={closingPress(holder)(onClearFilters)}>
                {words.clearFilters}
              </Button>
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
        words={words}
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
