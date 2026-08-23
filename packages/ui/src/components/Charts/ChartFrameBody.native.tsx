import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { ChartSkeleton } from './ChartSkeleton.native';
import type { ChartNote, ChartNoteTone, ChartSurfaceState } from './chart-state';
import { CHART_LOADING_LABEL, CHART_RETRY_LABEL, CHART_UNAVAILABLE_TITLE } from './chart-state';

interface ChartFrameBodyProps {
  state: ChartSurfaceState;
  height: number;
  note: ChartNote | null;
  onRetry?: () => void;
  children?: ReactNode;
}

const MARK: Record<ChartNoteTone, { bg: string; fg: string }> = {
  warning: { bg: theme.colors['warning-bg'], fg: theme.colors['warning-text'] },
  neutral: { bg: theme.colors['neutral-bg'], fg: theme.colors['text-tertiary'] },
};

const styles = StyleSheet.create({
  note: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-1'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['surface-alt'],
  },
  mark: {
    width: theme.spacing['sp-10'],
    height: theme.spacing['sp-10'],
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { maxWidth: 280 },
  /* The `unavailable` plate. It holds NOTHING but a centred UnavailableNote — the fourth state
     has one renderer and this frame does not draw a second one. */
  region: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['surface-alt'],
  },
  /* The region note's own padding is a full surface's (sp-12 / sp-6); inside a 200dp plot plate
     that is taller than the plate. sp-4 is the DS's own override here. */
  unavailable: { paddingVertical: theme.spacing['sp-4'], paddingHorizontal: theme.spacing['sp-4'] },
  retry: {
    marginTop: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
});

/* The exclamation-in-a-circle `error` and `empty` share. The fourth state's slashed circle is
   NOT drawn here — `UnavailableNote` owns that mark, and this frame composes it. */
function AlertGlyph() {
  return (
    <Svg viewBox="0 0 24 24" fill="none">
      <Path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
    </Svg>
  );
}

/**
 * The plot area, or the state that replaces it. Loading shimmers, `unavailable` states the
 * absence with no retry, and error / empty / not-enough-data share one note.
 */
export function ChartFrameBody({ state, height, note, onRetry, children }: ChartFrameBodyProps) {
  if (state === 'loading') {
    return <ChartSkeleton height={height} label={CHART_LOADING_LABEL} />;
  }

  if (state === 'unavailable') {
    /* The fourth state: no such series here — no provider, no coverage, a market that declares
       none. Neutral, and never a retry. Rendered by `UnavailableNote`, the system's ONE renderer
       of it, exactly as the design system's ChartFrame composes it. */
    return (
      <View style={[styles.region, { height }]}>
        <UnavailableNote
          variant="region"
          title={CHART_UNAVAILABLE_TITLE}
          style={styles.unavailable}
        />
      </View>
    );
  }

  if (note !== null) {
    return (
      <View style={[styles.note, { height }]}>
        <View style={[styles.mark, { backgroundColor: MARK[note.tone].bg }]}>
          <Icon size="md" color={MARK[note.tone].fg}>
            <AlertGlyph />
          </Icon>
        </View>
        <Text variant="body-sm" align="center">
          {note.title}
        </Text>
        {note.message === undefined ? null : (
          <Text variant="caption" color="secondary" align="center" style={styles.message}>
            {note.message}
          </Text>
        )}
        {state === 'error' && onRetry !== undefined ? (
          <Pressable onPress={onRetry} style={styles.retry}>
            <Text variant="body">{CHART_RETRY_LABEL}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return children ?? null;
}
