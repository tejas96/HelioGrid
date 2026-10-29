import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { closingPress } from '../../primitives/FocusAfter';
import { Button } from '../Button/Button.native';
import { RetryButton } from '../Button/RetryButton.native';
import { useFormat } from '../MarketProvider';
import { UnavailableNote } from '../UnavailableNote';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { applyFilter, filterDimensions } from './ActivityStream.filter';
import { ACTIVITY_KINDS, sortEntries } from './ActivityStream.kinds';
import { ACTIVITY_STREAM_DEFAULTS, streamStageOf } from './ActivityStream.logic';
import type { ActivityStreamProps } from './ActivityStream.types';
import { ActivityStreamList } from './ActivityStreamList.native';
import { StreamMessage, StreamSkeleton } from './ActivityStreamStates.native';
import { useActivityWindow } from './useActivityWindow';

interface NativeActivityStreamProps extends ActivityStreamProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  shell: { minWidth: 0, gap: theme.spacing['sp-4'] },
  shellFunctional: { gap: theme.spacing['sp-3'] },
});

/**
 * The append-only activity stream (`M02-35` / `SCR-M02-04`). It renders NO filter UI: a kind filter
 * over 13 values is a set, so the stream ships the two pure helpers and the screen mounts the panel.
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
  style,
}: NativeActivityStreamProps) {
  const stage = streamStageOf(surfaceStateOf(read), entries.length, filtered);
  const onRetry = retryOf(read);
  const format = useFormat();
  const { shown, reveal } = useActivityWindow(entries.length, visibleCount);
  /* The stream's own frame stays while a failed read reloads, so *Try again* hands the reader to
     it. */
  const holder = useRef<View>(null);

  /* Sorted before any early return, and deliberately not memoised: a hook after a conditional
     return changes the hook order between states, which is how a state transition crashes. */
  const sorted = sortEntries(entries, order);
  const shell: StyleProp<ViewStyle> = [
    styles.shell,
    density === 'functional' ? styles.shellFunctional : null,
    style,
  ];

  if (stage === 'loading') {
    return (
      <View ref={holder} style={shell}>
        <StreamSkeleton label={words.loading} />
      </View>
    );
  }
  if (stage === 'error') {
    return (
      <View ref={holder} style={shell}>
        <StreamMessage
          tone="warning"
          title={errorTitle}
          message={errorMessage}
          retry={<RetryButton onRetry={onRetry} label={retryLabel} focusAfter={holder} />}
        />
      </View>
    );
  }
  if (stage === 'unavailable') {
    return (
      <View ref={holder} style={shell}>
        <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
      </View>
    );
  }
  if (stage === 'empty') {
    return (
      <View ref={holder} style={shell}>
        <StreamMessage title={emptyTitle} message={emptyDescription} />
      </View>
    );
  }
  /* A filtered stream with nothing in it: the act clears the filters, never adds anything. */
  if (stage === 'filtered-empty') {
    return (
      <View ref={holder} style={shell}>
        <StreamMessage
          title={filteredEmptyTitle}
          message={filteredEmptyDescription}
          action={
            /* Clearing takes the filtered-empty state away: the screen reader goes to the stream. */
            onClearFilters !== undefined ? (
              <Button variant="secondary" size="md" onClick={closingPress(holder)(onClearFilters)}>
                {words.clearFilters}
              </Button>
            ) : null
          }
        />
      </View>
    );
  }

  return (
    <View ref={holder} style={shell}>
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
    </View>
  );
}

ActivityStream.filterDimensions = filterDimensions;
ActivityStream.applyFilter = applyFilter;
/** The default kind registry, exported so a screen can extend rather than replace it. */
ActivityStream.kinds = ACTIVITY_KINDS;
