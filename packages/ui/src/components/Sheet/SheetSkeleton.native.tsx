import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { DimensionValue } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import type { SheetDensity } from './Sheet.types';

interface SheetSkeletonProps {
  /** Sets the row gap — 16 expressive, 12 functional, the same ladder as the sheet's padding. */
  density?: SheetDensity;
  /** The status region's accessible name. The reference hardcodes it; no prop carries it. */
  label?: string;
}

/** The web half sweeps a gradient; RN has no CSS gradient loop, so it pulses opacity instead. */
export function ShimmerBar({ width, height }: { width: DimensionValue; height: number }) {
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
  return <Animated.View style={[styles.bar, { width, height, opacity }]} />;
}

/**
 * `loading` — content is coming, and never a placeholder value presented as a real one. The bars
 * carry no numbers for exactly that reason, and the node carries no `progressbar` for the same one:
 * web's `role="status"` has no RN spelling, so this is an accessibility element (folding nothing
 * but shimmer) named by `label` and announced politely.
 */
export function SheetSkeleton({ density = 'expressive', label = 'Loading' }: SheetSkeletonProps) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[styles.root, density === 'functional' ? styles.gapFunctional : styles.gapExpressive]}
    >
      <ShimmerBar width="62%" height={20} />
      <View style={styles.pair}>
        <ShimmerBar width="50%" height={68} />
        <ShimmerBar width="50%" height={68} />
      </View>
      <ShimmerBar width="100%" height={14} />
      <ShimmerBar width="76%" height={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: theme.spacing['sp-1'],
  },
  gapExpressive: { gap: theme.spacing['sp-4'] },
  gapFunctional: { gap: theme.spacing['sp-3'] },
  pair: {
    flexDirection: 'row',
    gap: theme.spacing['sp-3'],
  },
  bar: {
    borderRadius: theme.radius['r-sm'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
});
