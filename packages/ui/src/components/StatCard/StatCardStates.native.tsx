/* StatCard's four unresolved states (native). None of them prints a figure.

   The shimmer keyframe has no RN equivalent, so `loading` keeps the same footprint in
   --canvas-sunken: nothing reflows when the figure lands, which is what the shimmer was for. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { SurfaceState } from '../UnavailableNote';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';

const styles = StyleSheet.create({
  loading: { marginTop: 10, gap: theme.spacing['sp-2'] },
  shimmer: {
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  error: { marginTop: 10, alignItems: 'flex-start', gap: 10 },
  errorBody: { color: theme.colors['warning-text'] },
  retry: {
    paddingHorizontal: 18,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
  },
  retryWord: { fontWeight: '500' },
  block: { marginTop: 10 },
});

export function StatCardStates({
  state,
  label,
  emptyMessage,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: {
  state: SurfaceState;
  label: string;
  emptyMessage: string;
  errorMessage: string;
  onRetry?: () => void;
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
        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retry}>
            <Text variant="body-sm" style={styles.retryWord}>
              Try again
            </Text>
          </Pressable>
        ) : null}
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
