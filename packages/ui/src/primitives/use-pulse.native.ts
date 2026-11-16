import { theme } from '@heliogrid/theme';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, AppState } from 'react-native';
import { useReducedMotion } from './use-reduced-motion.native';

/**
 * A waiting box's opacity: the phone's one skeleton, standing in for the web's swept light
 * (`primitives/Skeleton/Skeleton.css`), which React Native cannot loop in CSS. One loop for the
 * whole wait, on the UI thread. A wait that ends inside the skeleton delay never flashes; reduced
 * motion holds it still at full ink; the loop stops when `running` ends and while the app is in the
 * background, and starts again when it comes back. A frame that is not waiting shows at once.
 */
export function usePulse(running = true): Animated.AnimatedMultiplication<number> {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(0)).current;
  const shown = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!running) {
      shown.setValue(1);
      return;
    }
    const appear = Animated.timing(shown, {
      toValue: 1,
      delay: theme.motion.skeletonDelayMs,
      duration: reduced ? 0 : theme.motion.durations.micro,
      useNativeDriver: true,
    });
    appear.start();
    return () => appear.stop();
  }, [reduced, running, shown]);
  useEffect(() => {
    if (reduced || !running) {
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: theme.motion.ambient.pulse,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: theme.motion.ambient.pulse,
          useNativeDriver: true,
        }),
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
  return useMemo(
    () =>
      Animated.multiply(shown, value.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] })),
    [shown, value],
  );
}
