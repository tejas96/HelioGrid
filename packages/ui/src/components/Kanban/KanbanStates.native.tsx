import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
/* The native half of a primitive is imported by file: the folder barrel re-exports `./Text`,
   which tsc's bundler resolution reads as the WEB half even in the native project. */
import type { FocusAfter } from '../../primitives/FocusAfter';
import { GroundProvider, glassTileSurface } from '../../primitives/Ground/Ground.native';
import { usePulse } from '../../primitives/use-pulse.native';
import { RetryButton } from '../Button/RetryButton.native';
import { StateRegion } from '../StateBody/StateRegion.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { KanbanBoardState } from './Kanban.logic';
import { boardMarkOf, KANBAN_SKELETON_BARS, skeletonColumnsOf } from './KanbanStates.logic';

/** The web half sweeps a gradient keyframe; RN has no CSS loop, so the bar pulses. */
function Bar({ style }: { style: object }) {
  const opacity = usePulse();
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
  return (
    <View style={[glassTileSurface, styles.message]}>
      {/* The message is a tile: what it holds reads the tile's ground. */}
      <GroundProvider ground="tile">
        <StateRegion
          tone={tone}
          glyph={boardMarkOf(tone)}
          title={title}
          message={message}
          action={<RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />}
        />
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
  bar: { backgroundColor: colors.canvas, borderRadius: theme.radius['rf-lg'] },
  headBar: {
    height: theme.spacing['sp-5'],
    width: '50%',
    marginTop: theme.spacing['sp-1'],
    marginHorizontal: 6,
    marginBottom: theme.spacing['sp-3'],
  },
  bars: { gap: theme.spacing['sp-2'] },
  cardBar: { height: 62 },
  /* The tile's look is `glassTileSurface` (`F7-49`), spread first in the frame. */
  message: {
    borderRadius: theme.radius['r-card-functional'],
  },
});
