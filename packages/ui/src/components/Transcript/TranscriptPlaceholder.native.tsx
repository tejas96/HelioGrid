/* The four states with no document to show (native) — loading, error, unavailable, and a call that
   connected but transcribed nothing. The header stays above every one of them; only this body
   below it changes.

   The shimmer keyframe has no RN equivalent, so `loading` holds the same bubble footprint in
   --canvas-sunken. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { RetryButton } from '../Button/RetryButton.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { placeholderOf, TRANSCRIPT_SKELETON_BARS } from './Transcript.logic';
import type { TranscriptPlaceholderProps } from './Transcript.types';
import { TRANSCRIPT_GAP } from './TranscriptChrome.native';

const styles = StyleSheet.create({
  skeletonBar: {
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  error: {
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
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

export function TranscriptPlaceholder({
  state,
  turnCount,
  density,
  emptyTitle,
  emptyDescription,
  errorMessage,
  onRetry,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  loadingLabel,
  focusAfter,
}: TranscriptPlaceholderProps) {
  const kind = placeholderOf(state, turnCount);

  if (kind === 'loading') {
    return (
      /* Web is `role="status"`. RN has none, and `progressbar` on four bubble-shaped bars would
         report a position they do not carry, so this is an accessibility element in its own right
         — the bars are decoration, nothing focusable is folded — announced politely. */
      <View
        accessible
        accessibilityLabel={loadingLabel}
        accessibilityLiveRegion="polite"
        style={{ rowGap: TRANSCRIPT_GAP[density] }}
      >
        {TRANSCRIPT_SKELETON_BARS.map((bar) => (
          <View key={bar.key} style={[styles.skeletonBar, { height: bar.tall ? 62 : 44 }]} />
        ))}
      </View>
    );
  }

  if (kind === 'error') {
    return (
      <View style={styles.error}>
        <Text variant="body-sm" style={styles.errorBody}>
          {errorMessage}
        </Text>
        {/* A tinted panel holds its retry as a tile does — see `Ground.css`. */}
        <GroundProvider ground="tile">
          <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
        </GroundProvider>
      </View>
    );
  }

  if (kind === 'unavailable') {
    return <UnavailableNote title={unavailableTitle} message={unavailableMessage} />;
  }

  if (kind === 'empty') {
    return (
      <View style={styles.empty}>
        <Text variant="body-sm" style={styles.emptyTitle}>
          {emptyTitle}
        </Text>
        {emptyDescription === undefined ? null : (
          <Text variant="body-sm" color="secondary" style={styles.emptyBody}>
            {emptyDescription}
          </Text>
        )}
      </View>
    );
  }

  return null;
}
