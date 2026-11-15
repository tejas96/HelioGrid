import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from '../../primitives/use-reduced-motion';

/**
 * 0 while the body rests at its top, 1 once it has scrolled: the title tucks into the handle's row
 * and the rows fade under it. It moves once per change of state, on the native driver, never per
 * scroll frame; under reduced motion it is at its end at once.
 */
export function useSheetTuck(scrolled: boolean): Animated.Value {
  const tuck = useRef(new Animated.Value(scrolled ? 1 : 0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    const to = scrolled ? 1 : 0;
    if (reduced) {
      tuck.setValue(to);
      return;
    }
    const move = Animated.timing(tuck, {
      toValue: to,
      duration: theme.motion.durations.standard,
      easing: Easing.bezier(...theme.motion.easings.standard),
      useNativeDriver: true,
    });
    move.start();
    return () => move.stop();
  }, [scrolled, reduced, tuck]);
  return tuck;
}
