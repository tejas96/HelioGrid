import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { useFormat } from '../MarketProvider';
import { UnavailableNote } from '../UnavailableNote';
import { applyFilter, filterDimensions } from './ActivityStream.filter';
import { ACTIVITY_KINDS, sortEntries } from './ActivityStream.kinds';
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
  button: {
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  buttonText: {
    fontFamily: theme.type.families.sans,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors['text-primary'],
  },
  spaced: { marginTop: 10 },
});

/**
 * The append-only activity stream (`M02-35` / `SCR-M02-04`). It renders NO filter UI: a kind filter
 * over 13 values is a set, so the stream ships the two pure helpers and the screen mounts the panel.
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
  style,
}: NativeActivityStreamProps) {
  const format = useFormat();
  const { shown, reveal } = useActivityWindow(entries.length, visibleCount);

  /* Sorted before any early return, and deliberately not memoised: a hook after a conditional
     return changes the hook order between states, which is how a state transition crashes. */
  const sorted = sortEntries(entries, order);
  const shell: StyleProp<ViewStyle> = [
    styles.shell,
    density === 'functional' ? styles.shellFunctional : null,
    style,
  ];

  if (state === 'loading') {
    return (
      <View style={shell}>
        <StreamSkeleton />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View style={shell}>
        <StreamMessage
          tone="warning"
          title={errorTitle}
          message={errorMessage}
          retry={
            onRetry !== undefined ? (
              <Pressable onPress={onRetry} style={[styles.button, styles.spaced]}>
                <Text style={styles.buttonText}>Try again</Text>
              </Pressable>
            ) : null
          }
        />
      </View>
    );
  }
  if (state === 'unavailable') {
    return (
      <View style={shell}>
        <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
      </View>
    );
  }
  /* A filtered stream with nothing in it is NOT "no activity yet" — the record is not empty, the
     filter is narrow, and the action clears the filters rather than offering to add anything. */
  if (state === 'empty' || entries.length === 0) {
    if (!filtered) {
      return (
        <View style={shell}>
          <StreamMessage title={emptyTitle} message={emptyDescription} />
        </View>
      );
    }
    return (
      <View style={shell}>
        <StreamMessage
          title={filteredEmptyTitle}
          message={filteredEmptyDescription}
          action={
            onClearFilters !== undefined ? (
              <Pressable onPress={onClearFilters} style={styles.button}>
                <Text style={styles.buttonText}>Clear filters</Text>
              </Pressable>
            ) : null
          }
        />
      </View>
    );
  }

  return (
    <View style={shell}>
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
    </View>
  );
}

ActivityStream.filterDimensions = filterDimensions;
ActivityStream.applyFilter = applyFilter;
/** The default kind registry, exported so a screen can extend rather than replace it. */
ActivityStream.kinds = ACTIVITY_KINDS;
