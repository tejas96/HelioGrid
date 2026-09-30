/* StatCard's four unresolved states (native). None of them prints a figure.

   The shimmer keyframe has no RN equivalent, so `loading` keeps the same footprint in still bars:
   nothing reflows when the figure lands, which is what the shimmer was for. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { RetryButton } from '../Button/RetryButton.native';
import type { SurfaceState } from '../UnavailableNote';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';

const styles = StyleSheet.create({
  loading: { marginTop: 10, gap: theme.spacing['sp-2'] },
  shimmer: {
    borderRadius: theme.radius['rf-md'],
    /* Drawn in --surface, as `Card`'s: a grey bar on the grey tile would not show. */
    backgroundColor: theme.colors.surface,
  },
  error: { marginTop: 10, alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  errorBody: { color: theme.colors['warning-text'] },
  block: { marginTop: 10 },
});

export function StatCardStates({
  state,
  label,
  emptyMessage,
  errorMessage,
  onRetry,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
}: {
  state: SurfaceState;
  label: string;
  emptyMessage: string;
  errorMessage: string;
  onRetry?: () => void;
  retryLabel?: string;
  unavailableTitle: string;
  unavailableMessage?: string;
}) {
  if (state === 'loading') {
    return (
      /* The role is a figure too, and this state prints none: web's `role="status"` has no RN
         counterpart, and `progressbar` would report a position two blank bars do not have. An
         accessibility element over pure decoration, named and announced politely, is the fact. */
      <View
        accessible
        accessibilityLabel={`Loading ${label}`}
        accessibilityLiveRegion="polite"
        style={styles.loading}
      >
        <View style={[styles.shimmer, { width: 132, height: 34 }]} />
        <View style={[styles.shimmer, { width: 84, height: 12 }]} />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View style={styles.error}>
        <Text variant="body-sm" style={styles.errorBody}>
          {errorMessage}
        </Text>
        <RetryButton onRetry={onRetry} label={retryLabel} />
      </View>
    );
  }
  if (state === 'unavailable') {
    return (
      <View style={styles.block}>
        <UnavailableNote title={unavailableTitle} message={unavailableMessage} />
      </View>
    );
  }
  if (state === 'empty') {
    return (
      <View style={styles.block}>
        <Text variant="body-sm" color="secondary">
          {emptyMessage}
        </Text>
      </View>
    );
  }
  return null;
}
