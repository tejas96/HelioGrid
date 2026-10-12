import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import type { LoadingBarSize, LoadingBarsProps } from './LoadingBars.types';

interface NativeLoadingBarsProps extends LoadingBarsProps {
  style?: StyleProp<ViewStyle>;
}

/** The web half's two heights: a closed section's header, and a section open with its fields. */
const BAR_HEIGHT: Record<LoadingBarSize, number> = { row: 56, panel: 188 };
/** Half of the web sweep's 1.4 s: the pulse dims, then returns. */
const HALF_PULSE_MS = 700;

const styles = StyleSheet.create({
  bars: { gap: theme.spacing['sp-2'] },
  bar: {
    borderRadius: theme.radius['r-lg'],
    // biome-ignore lint/plugin/raw-white: shimmer — a loading bar's shimmer
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
});

/**
 * The web half sweeps a gradient; React Native has no gradient loop, so the bar pulses opacity.
 * Reduced motion stills the web's sweep in the theme, so the pulse starts only when it is off.
 */
function Bar({ size }: { size: LoadingBarSize }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: HALF_PULSE_MS, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: HALF_PULSE_MS, useNativeDriver: true }),
      ]),
    );
    let unmounted = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!reduced && !unmounted) loop.start();
    });
    return () => {
      unmounted = true;
      loop.stop();
    };
  }, [value]);
  /* Rest is full ink: a bar that never starts its pulse, under reduced motion, must still show. */
  const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
  return <Animated.View style={[styles.bar, { height: BAR_HEIGHT[size], opacity }]} />;
}

/**
 * The bars a list shows in its own place while its record loads. React Native has no `status`
 * role: `accessible` makes the region one element so its name speaks, the polite live region
 * carries the web half's status fact, and `busy` its `aria-busy`.
 */
export function LoadingBars({ label, bars, style }: NativeLoadingBarsProps) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      style={[styles.bars, style]}
    >
      {bars.map((size, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: bars of one size are alike and never reorder
        <Bar key={index} size={size} />
      ))}
    </View>
  );
}
