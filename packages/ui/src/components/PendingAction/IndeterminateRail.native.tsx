import { theme } from '@heliogrid/theme';
import { useEffect, useRef, useState } from 'react';
import type { DimensionValue, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { BrandGradientFill } from '../ProgressBar/BrandGradientFill.native';
import type { IndeterminateRailProps } from './PendingAction.types';

interface NativeIndeterminateRailProps extends IndeterminateRailProps {
  /**
   * Native-only: `--gradient-brand` is a CSS string the web half passes through `tone`, which RN
   * cannot use as a colour. OperationProgress sets this instead and the segment wears the real
   * three-stop gradient.
   */
  gradient?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The travelling segment covers 34% of the rail, as on web. */
const SEGMENT = 0.34;

/** The shared contract types `width` as `number | string`; RN wants a DimensionValue. */
function asDimension(value: number | string): DimensionValue {
  if (typeof value === 'number') {
    return value;
  }
  const trimmed = value.trim();
  const parsed = Number.parseFloat(trimmed);
  if (trimmed.endsWith('%') && Number.isFinite(parsed)) {
    return `${parsed}%`;
  }
  return Number.isFinite(parsed) ? parsed : 'auto';
}

/** RN cannot translate by percentage, so the travel is measured from the laid-out width. */
function useTravel(trackWidth: number, reduce: boolean) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce || trackWidth === 0) {
      return;
    }
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1150,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, trackWidth, reduce]);
  return progress;
}

/** `prefers-reduced-motion` for RN. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (alive) {
          setReduce(enabled);
        }
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/**
 * The travelling segment. `width` is the rail; `thickness` its height.
 *
 * REDUCED MOTION IS READ, NOT IGNORED: under it the rail renders a static, dimmed, full-width fill
 * rather than freezing at 34%, which would read as a determinate third.
 */
export function IndeterminateRail({
  width = 22,
  thickness = 3,
  tone = theme.colors.accent,
  gradient = false,
  style,
}: NativeIndeterminateRailProps) {
  const reduce = useReduceMotion();
  const [trackWidth, setTrackWidth] = useState(typeof width === 'number' ? width : 0);
  const progress = useTravel(trackWidth, reduce);

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const segmentWidth = trackWidth * SEGMENT;
  const travel = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-segmentWidth, trackWidth + segmentWidth * 2],
  });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={onLayout}
      style={[styles.track, { width: asDimension(width), height: thickness }, style]}
    >
      <Animated.View
        style={[
          styles.segment,
          gradient ? styles.gradient : { backgroundColor: tone },
          reduce
            ? { width: '100%', opacity: 0.55 }
            : { width: segmentWidth, transform: [{ translateX: travel }] },
        ]}
      >
        {gradient ? <BrandGradientFill /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
    borderRadius: theme.radius['r-pill'],
  },
  gradient: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
});
