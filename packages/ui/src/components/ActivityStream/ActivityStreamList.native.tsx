import { theme } from '@heliogrid/theme';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { MarketFormat } from '../../utils/format';
import { dayKey, groupEntries } from './ActivityStream.kinds';
import type { ActivityEntry, ActivityStreamProps } from './ActivityStream.types';
import { StreamEntry } from './ActivityStreamEntry.native';

const type = theme.type.roles;

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  count: {
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    color: theme.colors['text-tertiary'],
  },
  /* The web half sticks the day heading; RN has no sticky outside a list host, so the heading
     scrolls with its group and the screen's own list owns any stickiness. */
  day: {
    paddingTop: 6,
    paddingBottom: 10,
    fontFamily: theme.type.families.sans,
    fontSize: type.overline.fontSize,
    fontWeight: '700',
    letterSpacing: type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.colors['text-tertiary'],
  },
  more: { flexDirection: 'row', justifyContent: 'center' },
  button: {
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  buttonBusy: { opacity: 0.6 },
  buttonText: {
    fontFamily: theme.type.families.sans,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors['text-primary'],
  },
});

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
 * the tree small without lying about how many entries exist, and the count states the whole.
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
        <View style={styles.toolbar}>
          {/* The count always states the whole, so a window never reads as the total. */}
          <Text style={styles.count}>{countLine}</Text>
          {toolbar}
        </View>
      ) : null}

      <View>
        {groups.map((group) => (
          <Fragment key={group.key}>
            {groupBy === 'day' && group.key !== 'all' ? (
              <Text style={styles.day}>{heading(group.key, group.date)}</Text>
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
      </View>

      {localMore || hasMore ? (
        <View style={styles.more}>
          <Pressable
            accessibilityLabel={`Show more activity. ${visible.length} of ${wholeTotal} shown.`}
            disabled={loadingMore}
            onPress={() => (localMore ? reveal(step) : onLoadMore?.())}
            style={[styles.button, loadingMore ? styles.buttonBusy : null]}
          >
            <Text style={styles.buttonText}>
              {loadingMore ? 'Loading…' : `Show ${remaining === 0 ? step : remaining} more`}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
