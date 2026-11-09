import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { IndeterminateRail } from '../PendingAction/IndeterminateRail.native';
import { Wordmark } from '../Wordmark/Wordmark.native';
import type { BootSplashProps } from './BootSplash.types';

/**
 * The session's wait on the phone (`BootSplash.types.ts`), filling the screen. It fades in after the
 * skeleton delay on the UI thread, so a quick answer never shows it.
 */
export function BootSplash({ label }: BootSplashProps) {
  const reduced = useReducedMotion();
  const shown = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const appear = Animated.timing(shown, {
      toValue: 1,
      duration: theme.motion.durations.ambient,
      delay: theme.motion.skeletonDelayMs,
      useNativeDriver: true,
    });
    appear.start();
    return () => appear.stop();
  }, [shown, reduced]);
  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      <Animated.View style={[styles.mark, { opacity: shown }]}>
        <Wordmark size={30} />
        {/* As wide as the wordmark's lead, two points thin: a line, never a bar. */}
        <IndeterminateRail width={theme.spacing['sp-24']} thickness={2} gradient />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  mark: { alignItems: 'center', gap: theme.spacing['sp-5'] },
});
