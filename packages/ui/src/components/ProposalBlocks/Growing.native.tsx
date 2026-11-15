import { theme } from '@heliogrid/theme';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, type StyleProp, View, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';

const { stepMs, maxItems } = theme.motion.stagger;

/**
 * A bar growing to its size once — the web halves' `hg-pb` bar-grow, on the phone: a scale on the
 * UI thread (transform only), from the bar's foot or its leading edge, a stagger step after the
 * bars before it. Its size is there from the first frame, so nothing waits on it; under reduced
 * motion it simply stands.
 */
export function Growing({
  axis,
  order = 0,
  style,
}: {
  /** `y` grows up from the foot (a month's bar); `x` grows from the leading edge (a bill, a split). */
  axis: 'x' | 'y';
  order?: number;
  style: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const grow = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    /* Reduced motion turned on mid-run: the bar stands at its end at once. */
    if (reduced) {
      grow.setValue(1);
      return;
    }
    const run = Animated.timing(grow, {
      toValue: 1,
      delay: Math.min(order, maxItems) * stepMs,
      duration: theme.motion.durations.data,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [grow, order, reduced]);
  const origin = axis === 'y' ? styles.fromFoot : styles.fromEdge;
  const scale = axis === 'y' ? { scaleY: grow } : { scaleX: grow };
  return <Animated.View style={[style, origin, { transform: [scale] }]} />;
}

const styles = {
  fromFoot: { transformOrigin: 'center bottom' },
  fromEdge: { transformOrigin: 'left center' },
  window: { overflow: 'hidden' },
  unseen: { opacity: 0 },
} as const;

/**
 * A line drawing itself once — the web halves' `hg-pb-draw`, on the phone, where an SVG stroke has
 * no UI-thread animation: a window slides in over the drawing from its leading edge while the
 * drawing slides back under it by the same step, so the drawing stands still and is uncovered from
 * its start to its end. Two transforms on the UI thread; under reduced motion it simply stands.
 */
export function Drawn({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const shown = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      shown.setValue(1);
      return;
    }
    if (width === 0) return;
    const run = Animated.timing(shown, {
      toValue: 1,
      delay: theme.motion.durations.micro,
      duration: theme.motion.durations.scene,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [shown, reduced, width]);
  const measured = reduced || width > 0;
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Animated.View
        style={[
          styles.window,
          /* One frame passes before the width is known: the drawing waits it out unseen. */
          measured ? undefined : styles.unseen,
          { transform: [{ translateX: shown.interpolate(range(-width)) }] },
        ]}
      >
        <Animated.View style={{ transform: [{ translateX: shown.interpolate(range(width)) }] }}>
          {children}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** From a step aside to its own place. */
const range = (from: number) => ({ inputRange: [0, 1], outputRange: [from, 0] });
