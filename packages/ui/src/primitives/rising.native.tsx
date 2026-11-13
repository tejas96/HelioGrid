import { theme } from '@heliogrid/theme';
import { type ReactNode, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from './use-reduced-motion.native';

const { stepMs, maxItems, risePx } = theme.motion.stagger;

/**
 * A block rising into place once, a stagger step after the blocks before it — transform and
 * opacity on the native driver. Its content is there from the first frame; under reduced motion it
 * simply stands. The web's twin is the `hg-rise` keyframe with `--i` and `--stagger-step`.
 */
export function Rising({ order, children }: { order: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const rise = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const anim = Animated.timing(rise, {
      toValue: 1,
      duration: theme.motion.durations.emphasised,
      delay: Math.min(order, maxItems) * stepMs,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [rise, order, reduced]);
  const style = {
    opacity: rise,
    transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [risePx, 0] }) }],
  };
  return <Animated.View style={style}>{children}</Animated.View>;
}
