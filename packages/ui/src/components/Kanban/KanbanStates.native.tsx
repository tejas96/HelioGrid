import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { KanbanBoardState } from './Kanban.logic';

const SKELETON_BARS = ['a', 'b', 'c'];
const SKELETONS = ['a', 'b', 'c', 'd'];

/** The web half sweeps a gradient keyframe; RN has no CSS loop, so the bar pulses. */
function Bar({ style }: { style: object }) {
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
  return <Animated.View style={[styles.bar, style, { opacity }]} />;
}

/**
 * A column-shaped placeholder — never a value presented as a real one, and that goes for the role.
 * The web half is `role="status"`; RN has no `status`, and `progressbar` would promise a measurable
 * position four pulsing bars have none of. `accessible` folds only those bars — no card here is a
 * drop target or a Pressable yet — so the label speaks without putting anything out of reach.
 */
export function ColumnSkeleton({ width }: { width: number | '100%' }) {
  return (
    <View
      accessible
      accessibilityLabel="Loading board"
      accessibilityLiveRegion="polite"
      style={[styles.skeleton, { width }]}
    >
      <Bar style={styles.headBar} />
      <View style={styles.bars}>
        {SKELETON_BARS.map((k) => (
          <Bar key={k} style={styles.cardBar} />
        ))}
      </View>
    </View>
  );
}

interface BoardMessageProps {
  tone?: 'warning';
  title: string;
  message?: string;
  onRetry?: () => void;
}

/** The board's own empty and error surfaces. `unavailable` is `UnavailableNote`'s, never this. */
export function BoardMessage({ tone, title, message, onRetry }: BoardMessageProps) {
  const warning = tone === 'warning';
  const ink = warning ? theme.colors['warning-text'] : theme.colors['text-tertiary'];
  return (
    <View style={styles.message}>
      <View style={[styles.mark, warning ? styles.markWarning : null]}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          {warning ? (
            <>
              <Path d="M12 9v4M12 17h.01" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
              <Circle cx={12} cy={12} r={9} stroke={ink} strokeWidth={1.5} />
            </>
          ) : (
            <>
              <Rect x={3} y={4} width={5} height={16} rx={1.5} stroke={ink} strokeWidth={1.5} />
              <Rect x={10} y={4} width={5} height={10} rx={1.5} stroke={ink} strokeWidth={1.5} />
              <Rect x={17} y={4} width={4} height={7} rx={1.5} stroke={ink} strokeWidth={1.5} />
            </>
          )}
        </Svg>
      </View>
      <Text variant="h4" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body-sm" color="secondary" align="center" style={styles.messageText}>
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text variant="body" style={styles.retryWords}>
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface BoardStateViewProps {
  state: KanbanBoardState;
  stacked: boolean;
  columnWidth: number;
  errorTitle: string;
  errorMessage: string;
  onRetry?: () => void;
  unavailableTitle: string;
  unavailableMessage?: string;
  emptyTitle: string;
  emptyDescription?: string;
}

/**
 * The face the board shows instead of its columns. `loading` holds the columns' own footprint so
 * nothing reflows when the board lands; `unavailable` is `UnavailableNote`'s — no such board here
 * at all — while `error` and `empty` are the board's own surfaces.
 */
export function BoardStateView({
  state,
  stacked,
  columnWidth,
  errorTitle,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
  emptyTitle,
  emptyDescription,
}: BoardStateViewProps) {
  if (state === 'error') {
    return (
      <BoardMessage tone="warning" title={errorTitle} message={errorMessage} onRetry={onRetry} />
    );
  }
  if (state === 'unavailable') {
    return (
      <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
    );
  }
  if (state === 'loading') {
    return (
      <>
        {(stacked ? SKELETONS.slice(0, 1) : SKELETONS).map((k) => (
          <ColumnSkeleton key={k} width={stacked ? '100%' : columnWidth} />
        ))}
      </>
    );
  }
  return <BoardMessage title={emptyTitle} message={emptyDescription} />;
}

const styles = StyleSheet.create({
  skeleton: {
    flexShrink: 0,
    backgroundColor: theme.colors['canvas-sunken'],
    borderRadius: theme.radius['r-card-functional'],
    padding: 10,
  },
  bar: { backgroundColor: theme.colors.canvas, borderRadius: theme.radius['rf-lg'] },
  headBar: {
    height: theme.spacing['sp-5'],
    width: '50%',
    marginTop: theme.spacing['sp-1'],
    marginHorizontal: 6,
    marginBottom: theme.spacing['sp-3'],
  },
  bars: { gap: theme.spacing['sp-2'] },
  cardBar: { height: 62 },
  message: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: 56,
    paddingHorizontal: theme.spacing['sp-6'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-functional'],
    ...theme.elevation.e2,
  },
  mark: {
    width: theme.spacing['sp-12'],
    height: theme.spacing['sp-12'],
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors['neutral-bg'],
    marginBottom: theme.spacing['sp-1'],
  },
  markWarning: { backgroundColor: theme.colors['warning-bg'] },
  messageText: { maxWidth: 320 },
  retry: {
    marginTop: 10,
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  retryWords: { fontWeight: '500' },
});
