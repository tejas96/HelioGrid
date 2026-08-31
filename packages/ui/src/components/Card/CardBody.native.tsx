import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Animated, StyleSheet, Text, View } from 'react-native';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Pressable`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { CardProps } from './Card.types';

const styles = StyleSheet.create({
  loading: { gap: 10 },
  shimmer: {
    height: 12,
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  message: { alignItems: 'flex-start', gap: 10 },
  messageText: {
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles['body-sm'].fontSize,
    lineHeight: theme.type.roles['body-sm'].lineHeight,
    color: theme.colors['text-secondary'],
  },
  messageWarning: { color: theme.colors['warning-text'] },
  messageTitle: { fontWeight: '700', color: theme.colors['text-primary'] },
  retry: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  retryText: {
    fontFamily: theme.type.families.sans,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors['text-primary'],
  },
});

/** The web half animates a gradient sweep; RN has no CSS gradient loop, so it pulses opacity. */
function Shimmer({ width }: { width: `${number}%` }) {
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

export function CardMessage({
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
  const text: StyleProp<TextStyle> = [
    styles.messageText,
    tone === 'warning' ? styles.messageWarning : null,
  ];
  return (
    <View style={styles.message}>
      <Text style={text}>
        {title !== undefined ? (
          <Text style={[text, styles.messageTitle]}>
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

/**
 * The card's frame, padding and radius never move between states — only this body changes.
 * `unavailable` renders through `UnavailableNote`: neutral, and no retry.
 *
 * IT IS ITS OWN FILE, AS ON THE WEB. The states used to live inside `Card.native.tsx` while the
 * web half kept them in `CardBody.tsx`, so the two halves of the loading region — `role="status"`
 * + `aria-label="Loading"` on one side, `accessibilityLabel` + a polite live region on the other —
 * were never in files that pair. Same split, same basenames, one comparable pair.
 */
export function CardBody({
  children,
  state,
  emptyTitle,
  emptyMessage,
  emptyAction,
  errorTitle,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: Required<Pick<CardProps, 'state' | 'emptyMessage' | 'errorTitle' | 'errorMessage'>> &
  Pick<
    CardProps,
    | 'children'
    | 'emptyTitle'
    | 'emptyAction'
    | 'onRetry'
    | 'unavailableTitle'
    | 'unavailableMessage'
  >) {
  if (state === 'loading') {
    return (
      /* Web says `role="status"` — "something is loading here". RN has no `status` role, and
         `progressbar` with no `accessibilityValue` claims a position three shimmers do not have.
         `accessible` makes the node an element so the label speaks (it folds only decoration), and
         the polite live region is what carries web's status fact. */
      <View
        accessible
        accessibilityLabel="Loading"
        accessibilityLiveRegion="polite"
        style={styles.loading}
      >
        <Shimmer width="70%" />
        <Shimmer width="92%" />
        <Shimmer width="54%" />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <CardMessage
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
    /* No retry, no warning tint — the absence is stated, not styled as a fault. */
    return <UnavailableNote title={unavailableTitle} message={unavailableMessage} />;
  }
  if (state === 'empty') {
    return <CardMessage title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }
  return <>{children}</>;
}
