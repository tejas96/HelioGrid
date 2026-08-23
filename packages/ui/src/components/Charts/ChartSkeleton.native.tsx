import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';

interface ChartSkeletonProps {
  height: number;
  label: string;
}

const styles = StyleSheet.create({
  block: {
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
});

/**
 * The loading placeholder. The web half runs the `hg-sheet-shimmer` keyframe, which the token
 * stylesheet already drops under `prefers-reduced-motion`; RN has no media query, so the same
 * ruling is read from `AccessibilityInfo` and the loop simply never starts — the block stays,
 * dimmed and legible, so the surface never reads as content.
 */
export function ChartSkeleton({ height, label }: ChartSkeletonProps) {
  const pulse = useRef(new Animated.Value(0));

  useEffect(() => {
    const value = pulse.current;
    const step = (toValue: number) =>
      Animated.timing(value, {
        toValue,
        duration: theme.motion.durations.ambient,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([step(1), step(0)]));
    let cancelled = false;
    const start = async () => {
      const reduced = await AccessibilityInfo.isReduceMotionEnabled();
      if (!reduced && !cancelled) {
        loop.start();
      }
    };
    void start();
    return () => {
      cancelled = true;
      loop.stop();
    };
  }, []);

  const opacity = pulse.current.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    /* The web half is `role="status"`. RN has no `status`, and `progressbar` would promise a
       plotted position the block has none of, so the truthful form is an accessibility element
       carrying the same name web's `aria-label` carries, announced politely. */
    <Animated.View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[styles.block, { height, opacity }]}
    />
  );
}
