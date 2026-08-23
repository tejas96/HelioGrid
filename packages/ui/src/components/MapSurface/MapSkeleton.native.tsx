import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors['canvas-sunken'],
  },
});

/**
 * The loading placeholder. The web half runs the `hg-sheet-shimmer` keyframe, which the token
 * stylesheet drops under `prefers-reduced-motion`; RN reads the same ruling from
 * `AccessibilityInfo` and simply never starts the loop — the block stays, so the surface never
 * reads as "no sites".
 */
export function MapSkeleton() {
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
    /* Web's skeleton is `role="status"`. RN has no `status`, and `progressbar` would promise a
       measurable position this pulse does not have, so the honest form is an accessibility element
       (`accessible`, folding nothing but the block itself) named by its label, announced politely. */
    <Animated.View
      accessible
      accessibilityLabel="Loading map"
      accessibilityLiveRegion="polite"
      style={[styles.block, { opacity }]}
    />
  );
}
