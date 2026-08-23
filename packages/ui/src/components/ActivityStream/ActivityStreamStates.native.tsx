import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const type = theme.type.roles;

const styles = StyleSheet.create({
  shimmer: { borderRadius: theme.radius['rf-md'], backgroundColor: theme.colors['canvas-sunken'] },
  skeleton: { gap: theme.spacing['sp-5'] },
  skeletonRow: { flexDirection: 'row', columnGap: theme.spacing['sp-3'] },
  skeletonMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors['canvas-sunken'],
  },
  skeletonLines: { flex: 1, gap: theme.spacing['sp-2'] },
  message: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: 40,
    paddingHorizontal: theme.spacing['sp-4'],
  },
  messageMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: theme.colors['neutral-bg'],
  },
  messageMarkWarning: { backgroundColor: theme.colors['warning-bg'] },
  title: {
    fontFamily: theme.type.families.sans,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.16,
    textAlign: 'center',
    color: theme.colors['text-primary'],
  },
  text: {
    fontFamily: theme.type.families.sans,
    fontSize: type['body-sm'].fontSize,
    lineHeight: 19.5,
    textAlign: 'center',
    maxWidth: 320,
    color: theme.colors['text-secondary'],
  },
  extra: { marginTop: 10 },
});

/** The web half animates a gradient sweep; RN has no CSS gradient loop, so it pulses opacity. */
export function StreamShimmer({ width, height }: { width: `${number}%`; height: number }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  return <Animated.View style={[styles.shimmer, { width, height, opacity }]} />;
}

/**
 * Four entry-shaped rows: the stream keeps its shape while its content is coming. Web says
 * `role="status"`, which RN has no spelling for; `progressbar` would claim a position an unread
 * feed cannot report, so the node is an accessibility element instead — the rows are shimmer, so
 * nothing focusable is folded — and it announces politely.
 */
export function StreamSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading activity"
      accessibilityLiveRegion="polite"
      style={styles.skeleton}
    >
      {['a', 'b', 'c', 'd'].map((row) => (
        <View key={row} style={styles.skeletonRow}>
          <View style={styles.skeletonMark} />
          <View style={styles.skeletonLines}>
            <StreamShimmer width="34%" height={11} />
            <StreamShimmer width="76%" height={14} />
            <StreamShimmer width="28%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

function MessageGlyph({ warning, color }: { warning: boolean; color: string }) {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {warning ? (
        <>
          <Path d="M12 9v4M12 17h.01" stroke={color} />
          <Circle cx="12" cy="12" r="9" stroke={color} />
        </>
      ) : (
        <Path d="M4 6h16M4 12h16M4 18h10" stroke={color} />
      )}
    </Svg>
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
  title: string;
  message?: string;
  action?: ReactNode;
  retry?: ReactNode;
}) {
  const warning = tone === 'warning';
  return (
    <View style={styles.message}>
      <View style={[styles.messageMark, warning ? styles.messageMarkWarning : null]}>
        <MessageGlyph
          warning={warning}
          color={warning ? theme.colors['warning-text'] : theme.colors['text-tertiary']}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message !== undefined ? <Text style={styles.text}>{message}</Text> : null}
      {retry}
      {action !== undefined && action !== null ? <View style={styles.extra}>{action}</View> : null}
    </View>
  );
}
