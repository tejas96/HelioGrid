/* The four states with no document to show (native) — loading, error, unavailable, and a call that
   connected but transcribed nothing. The header stays above every one of them; only this body
   below it changes.

   The shimmer keyframe has no RN equivalent, so `loading` holds the same bubble footprint in
   --canvas-sunken. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { SurfaceState } from '../UnavailableNote';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { TRANSCRIPT_GAP, TranscriptPlainButton } from './TranscriptChrome.native';

const styles = StyleSheet.create({
  skeletonBar: {
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  error: {
    alignItems: 'flex-start',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['warning-bg'],
  },
  errorBody: { color: theme.colors['warning-text'] },
  empty: {
    padding: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  emptyTitle: { fontWeight: '700', letterSpacing: theme.type.roles.h4.letterSpacing },
  emptyBody: { marginTop: 6 },
});

interface TranscriptPlaceholderProps {
  state: SurfaceState;
  turnCount: number;
  density: 'expressive' | 'functional';
  emptyTitle: string;
  emptyDescription: string;
  errorMessage: string;
  onRetry?: () => void;
  unavailableTitle: string;
  unavailableMessage: string;
}

export function TranscriptPlaceholder({
  state,
  turnCount,
  density,
  emptyTitle,
  emptyDescription,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: TranscriptPlaceholderProps) {
  if (state === 'loading') {
    return (
      /* Web is `role="status"`. RN has none, and `progressbar` on four bubble-shaped bars would
         report a position they do not carry, so this is an accessibility element in its own right
         — the bars are decoration, nothing focusable is folded — announced politely. */
      <View
        accessible
        accessibilityLabel="Loading the transcript"
        accessibilityLiveRegion="polite"
        style={{ rowGap: TRANSCRIPT_GAP[density] }}
      >
        {['a', 'b', 'c', 'd'].map((row, i) => (
          <View key={row} style={[styles.skeletonBar, { height: i % 2 ? 44 : 62 }]} />
        ))}
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={styles.error}>
        <Text variant="body-sm" style={styles.errorBody}>
          {errorMessage}
        </Text>
        {onRetry ? (
          <TranscriptPlainButton onPress={onRetry}>Try again</TranscriptPlainButton>
        ) : null}
      </View>
    );
  }

  if (state === 'unavailable') {
    return <UnavailableNote title={unavailableTitle} message={unavailableMessage} />;
  }

  if (turnCount === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="body-sm" style={styles.emptyTitle}>
          {emptyTitle}
        </Text>
        <Text variant="body-sm" color="secondary" style={styles.emptyBody}>
          {emptyDescription}
        </Text>
      </View>
    );
  }

  return null;
}
