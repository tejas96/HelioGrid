import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import type { FocusAfter } from '../../primitives/FocusAfter';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { RetryButton } from '../Button/RetryButton.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { KanbanBoardState } from './Kanban.logic';
import { boardMarkOf, KANBAN_SKELETON_BARS, skeletonColumnsOf } from './KanbanStates.logic';

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
export function ColumnSkeleton({
  width,
  label,
}: {
  width: number | '100%';
  label: TranslatedText;
}) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[styles.skeleton, { width }]}
    >
      <Bar style={styles.headBar} />
      <View style={styles.bars}>
        {KANBAN_SKELETON_BARS.map((k) => (
          <Bar key={k} style={styles.cardBar} />
        ))}
      </View>
    </View>
  );
}

interface BoardMessageProps {
  tone?: 'warning';
  title?: TranslatedText;
  message?: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  /** The board's frame, where focus lands once the retry has left. */
  focusAfter: FocusAfter;
}

/** The board's own empty and error surfaces. `unavailable` is `UnavailableNote`'s, never this. */
export function BoardMessage({
  tone,
  title,
  message,
  onRetry,
  retryLabel,
  focusAfter,
}: BoardMessageProps) {
  const warning = tone === 'warning';
  const ink = warning ? theme.colors['warning-text'] : theme.colors['text-tertiary'];
  return (
    <View style={[tileSurface, styles.message]}>
      {/* The message is a tile: what it holds reads the tile's ground. */}
      <GroundProvider ground="tile">
        <View style={[styles.mark, warning ? styles.markWarning : null]}>
          <Svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={ink}
            strokeWidth={1.5}
            strokeLinecap="round"
          >
            <ShellGlyphMarks name={boardMarkOf(tone)} />
          </Svg>
        </View>
        {title ? (
          <Text variant="h4" align="center">
            {title}
          </Text>
        ) : null}
        {message ? (
          <Text variant="body-sm" color="secondary" align="center" style={styles.messageText}>
            {message}
          </Text>
        ) : null}
        <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
      </GroundProvider>
    </View>
  );
}

export interface BoardStateViewProps {
  state: KanbanBoardState;
  stacked: boolean;
  columnWidth: number;
  loadingLabel: TranslatedText;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  /** The board's frame, where focus lands once the retry has left. */
  focusAfter: FocusAfter;
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  emptyTitle?: TranslatedText;
  emptyDescription?: TranslatedText;
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
  loadingLabel,
  errorTitle,
  errorMessage,
  onRetry,
  retryLabel,
  focusAfter,
  unavailableTitle,
  unavailableMessage,
  emptyTitle,
  emptyDescription,
}: BoardStateViewProps) {
  if (state === 'error') {
    return (
      <BoardMessage
        tone="warning"
        title={errorTitle}
        message={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
        focusAfter={focusAfter}
      />
    );
  }
  if (state === 'unavailable') {
    return unavailableTitle === undefined ? null : (
      <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
    );
  }
  if (state === 'loading') {
    return (
      <>
        {skeletonColumnsOf(stacked).map((k) => (
          <ColumnSkeleton key={k} width={stacked ? '100%' : columnWidth} label={loadingLabel} />
        ))}
      </>
    );
  }
  return <BoardMessage title={emptyTitle} message={emptyDescription} focusAfter={focusAfter} />;
}

const styles = StyleSheet.create({
  /* On the page, as the column it stands in for. */
  skeleton: {
    flexShrink: 0,
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
  /* The tile's look is `tileSurface` (`F7-49`), spread first in the frame. */
  message: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: 56,
    paddingHorizontal: theme.spacing['sp-6'],
    borderRadius: theme.radius['r-card-functional'],
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
});
