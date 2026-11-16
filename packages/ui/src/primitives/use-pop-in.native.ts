import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from './use-reduced-motion.native';

const { popPx, popScale } = theme.motion.enter;

/**
 * A layer popping in as it mounts — a menu's list — up from a little below and a touch smaller,
 * fading in, on the native driver: the web's `hg-pop-in`. Its rows are there and pressable from
 * the first frame; under reduced motion it simply stands.
 */
export function usePopIn() {
  const reduced = useReducedMotion();
  const pop = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      pop.setValue(1);
      return;
    }
    const anim = Animated.timing(pop, {
      toValue: 1,
      duration: theme.motion.durations.standard,
      easing: Easing.bezier(...theme.motion.easings['out-quint']),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [pop, reduced]);
  return {
    opacity: pop,
    transform: [
      { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [popPx, 0] }) },
      { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [popScale, 1] }) },
    ],
  };
}
