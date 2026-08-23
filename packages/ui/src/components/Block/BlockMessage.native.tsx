import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { BlockProps } from './Block.types';

const type = theme.type.roles;

const styles = StyleSheet.create({
  shimmer: {
    height: 12,
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  message: {
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
    paddingTop: 4,
    paddingBottom: 2,
  },
  text: {
    fontFamily: theme.type.families.sans,
    fontSize: type['body-sm'].fontSize,
    lineHeight: type['body-sm'].lineHeight,
    color: theme.colors['text-secondary'],
  },
  warning: { color: theme.colors['warning-text'] },
  title: { fontWeight: '700', color: theme.colors['text-primary'] },
  loading: { gap: 10 },
  retry: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  retryText: {
    fontFamily: theme.type.families.sans,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors['text-primary'],
  },
});

/** The web half animates a gradient sweep; RN has no CSS gradient loop, so it pulses opacity. */
export function BlockShimmer({ width }: { width: `${number}%` }) {
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
  return <Animated.View style={[styles.shimmer, { width, opacity }]} />;
}

/** The one quiet sentence a block's empty, error and unavailable bodies all render. */
export function BlockMessage({
  tone,
  title,
  message,
  action,
}: {
  tone?: 'warning';
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  const text: StyleProp<TextStyle> = [styles.text, tone === 'warning' ? styles.warning : null];
  return (
    <View style={styles.message}>
      <Text style={text}>
        {title !== undefined ? (
          <Text style={[text, styles.title]}>
            {title}
            {message !== undefined ? ' — ' : ''}
          </Text>
        ) : null}
        {message}
      </Text>
      {action}
    </View>
  );
}

export type BlockBodyProps = Required<
  Pick<BlockProps, 'state' | 'emptyMessage' | 'errorTitle' | 'errorMessage' | 'unavailableTitle'>
> &
  Pick<
    BlockProps,
    'children' | 'title' | 'emptyTitle' | 'emptyAction' | 'onRetry' | 'unavailableMessage'
  >;

/** The body is the only part that moves between states; the header and the frame stay put. */
export function BlockBody({
  children,
  title,
  state,
  emptyMessage,
  emptyTitle,
  emptyAction,
  errorTitle,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: BlockBodyProps) {
  if (state === 'loading') {
    return (
      /* Web's body is `role="status"`. RN has no `status`, and `progressbar` with no
         `accessibilityValue` claims a position three shimmers do not have, so the node is made an
         accessibility element over pure decoration and announces the same fact politely. */
      <View
        accessible
        accessibilityLabel={title !== undefined ? `Loading ${title}` : 'Loading'}
        accessibilityLiveRegion="polite"
        style={styles.loading}
      >
        <BlockShimmer width="72%" />
        <BlockShimmer width="94%" />
        <BlockShimmer width="58%" />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <BlockMessage
        tone="warning"
        title={errorTitle}
        message={errorMessage}
        action={
          onRetry !== undefined ? (
            <Pressable style={styles.retry} onPress={onRetry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          ) : null
        }
      />
    );
  }
  if (state === 'unavailable') {
    return <BlockMessage title={unavailableTitle} message={unavailableMessage} />;
  }
  if (state === 'empty') {
    /* Says so and stays. No icon, no bloom, no 48px of air — the screen around it is full. */
    return <BlockMessage title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }
  return <>{children}</>;
}
