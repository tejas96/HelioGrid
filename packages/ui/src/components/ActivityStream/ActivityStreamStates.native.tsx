import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { usePulse } from '../../primitives/use-pulse.native';
import { StateRegion } from '../StateBody/StateRegion.native';
import { STREAM_SKELETON } from './ActivityStream.logic';

// web-only part: Button — its retry is a slot ActivityStream.native fills with RetryButton.

const styles = StyleSheet.create({
  shimmer: { borderRadius: theme.radius['rf-md'], backgroundColor: colors['canvas-sunken'] },
  skeleton: { gap: theme.spacing['sp-5'] },
  skeletonRow: { flexDirection: 'row', columnGap: theme.spacing['sp-3'] },
  skeletonMark: {
    width: 36,
    height: 36,
    borderRadius: theme.radius['r-tile'],
    backgroundColor: colors['canvas-sunken'],
  },
  skeletonLines: { flex: 1, gap: theme.spacing['sp-2'] },
});

/** One waiting bar, pulsing as every phone skeleton does (`usePulse`). */
export function StreamShimmer({ width, height }: { width: `${number}%`; height: number }) {
  const opacity = usePulse();
  return <Animated.View style={[styles.shimmer, { width, height, opacity }]} />;
}

/**
 * Four entry-shaped rows: the stream keeps its shape while its content is coming. Web says
 * `role="status"`, which RN has no spelling for; `progressbar` would claim a position an unread
 * feed cannot report, so the node is an accessibility element instead — the rows are shimmer, so
 * nothing focusable is folded — and it announces politely.
 */
export function StreamSkeleton({ label }: { label: TranslatedText }) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={styles.skeleton}
    >
      {STREAM_SKELETON.rows.map((row) => (
        <View key={row} style={styles.skeletonRow}>
          <View style={styles.skeletonMark} />
          <View style={styles.skeletonLines}>
            {STREAM_SKELETON.lines.map((line) => (
              <StreamShimmer key={line.key} width={line.width} height={line.height} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * The centred sentence the empty and error states share. A filtered stream with nothing in it is
 * NOT "no activity yet" — the record is not empty, the filter is narrow.
 */
export function StreamMessage({
  tone,
  title,
  message,
  action,
  retry,
}: {
  tone?: 'warning';
  title: TranslatedText;
  message?: TranslatedText;
  action?: ReactNode;
  retry?: ReactNode;
}) {
  return (
    <StateRegion
      tone={tone}
      glyph="lines"
      title={title}
      message={message}
      action={
        <>
          {retry}
          {action}
        </>
      }
    />
  );
}
