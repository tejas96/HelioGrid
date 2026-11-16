/* StatCard's four unresolved states (native). None of them prints a figure: `loading` keeps the
   value's footprint in pulsing bars, so nothing reflows when the figure lands; the rest are
   `StateBody`. */

import { theme } from '@heliogrid/theme';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { usePulse } from '../../primitives/use-pulse.native';
import { StateBody } from '../StateBody/StateBody.native';
import type { StatCardStatesProps } from './StatCard.types';

export function StatCardStates({ state, loadingLabel, ...words }: StatCardStatesProps) {
  const opacity = usePulse(state === 'loading');
  if (state === 'loading') {
    return (
      /* The role is a figure too, and this state prints none: web's `role="status"` has no RN
         counterpart, and `progressbar` would report a position two blank bars do not have. An
         accessibility element over pure decoration, named and announced politely, is the fact. */
      <View
        accessible
        accessibilityLabel={loadingLabel}
        accessibilityLiveRegion="polite"
        style={styles.loading}
      >
        <Animated.View style={[styles.shimmer, styles.value, { opacity }]} />
        <Animated.View style={[styles.shimmer, styles.meta, { opacity }]} />
      </View>
    );
  }
  if (state === 'ready') return null;
  return (
    <View style={styles.state}>
      <StateBody state={state} {...words} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 10, gap: theme.spacing['sp-2'] },
  shimmer: { borderRadius: theme.radius['rf-md'], backgroundColor: colors['canvas-sunken'] },
  value: { width: 132, height: 34 },
  meta: { width: 84, height: theme.spacing['sp-3'] },
  state: { marginTop: 10 },
});
