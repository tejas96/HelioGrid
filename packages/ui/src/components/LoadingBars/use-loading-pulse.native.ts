import { useEffect, useRef } from 'react';
import { Animated, AppState } from 'react-native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';

/** Half of the web sweep's 1.4 s: the pulse dims, then returns. */
const HALF_PULSE_MS = 700;

/**
 * The web half sweeps a gradient; React Native has no gradient loop, so a wait pulses opacity —
 * one loop for the whole wait, on the UI thread. Reduced motion holds it still at full ink; the
 * loop stops when `running` ends and while the app is in the background, and starts again when it
 * comes back. Shared by every wait drawn in the theme's shimmer (`LoadingBars`, `PreviewFrame`).
 */
export function useLoadingPulse(running = true): Animated.AnimatedInterpolation<number> {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced || !running) {
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: HALF_PULSE_MS, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: HALF_PULSE_MS, useNativeDriver: true }),
      ]),
    );
    loop.start();
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') loop.start();
      else loop.stop();
    });
    return () => {
      app.remove();
      loop.stop();
    };
  }, [reduced, running, value]);
  return value.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
}
