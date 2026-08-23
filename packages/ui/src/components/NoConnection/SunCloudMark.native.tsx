import { theme } from '@heliogrid/theme';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { BrandGradientFill } from '../ProgressBar/BrandGradientFill.native';

const SIZE = 132;

/**
 * `--glow-brand` for RN. The token is a CSS radial-gradient; its three stops are --iris-violet at
 * 22%, --iris-blue at 14% and a transparent edge, so the same gradient is rebuilt from those
 * tokens rather than from any raw colour.
 */
function Glow() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <RadialGradient id="hgGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={theme.colors['iris-violet']} stopOpacity={0.22} />
          <Stop offset="0.4" stopColor={theme.colors['iris-blue']} stopOpacity={0.14} />
          <Stop offset="0.72" stopColor={theme.colors.surface} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#hgGlow)" />
    </Svg>
  );
}

/** `prefers-reduced-motion` for RN — the same query the web half reads from CSS. */
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

/** An alternating 0 → 1 → 0 loop, which is CSS `infinite alternate`. */
function useAlternatingLoop(active: boolean, halfDuration: number) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: halfDuration,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: halfDuration,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, halfDuration, progress]);
  return progress;
}

/**
 * Sun behind a slowly drifting cloud. Circles and pills only — no drawn artwork.
 *
 * The one piece of charm in the system and the only screen that earns it. It holds still under
 * reduce-motion, which is the same promise the web half makes through the media query.
 */
export function SunCloudMark({ animate = true }: { animate?: boolean }) {
  const reduce = useReduceMotion();
  const moving = animate && !reduce;
  const drift = useAlternatingLoop(moving, 9000);
  const breathe = useAlternatingLoop(moving, 4000);

  const driftX = drift.interpolate({ inputRange: [0, 1], outputRange: [-34, 34] });
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });
  const breatheOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.mark}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          moving ? { transform: [{ scale: breatheScale }], opacity: breatheOpacity } : null,
        ]}
      >
        <Glow />
      </Animated.View>
      <View style={styles.sun}>
        <BrandGradientFill />
      </View>
      <Animated.View
        style={[styles.cloud, moving ? { transform: [{ translateX: driftX }] } : null]}
      >
        <View style={styles.cloudBase} />
        <View style={styles.cloudLobeA} />
        <View style={styles.cloudLobeB} />
      </Animated.View>
    </View>
  );
}

const part = {
  position: 'absolute',
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius['r-pill'],
} as const;

const styles = StyleSheet.create({
  mark: {
    position: 'relative',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  glow: {
    position: 'absolute',
    width: SIZE * 1.55,
    height: SIZE * 1.55,
    borderRadius: theme.radius['r-pill'],
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: theme.radius['r-pill'],
    overflow: 'hidden',
    ...theme.elevation.e2,
  },
  cloud: { position: 'absolute', top: 62, left: 6, width: 118, height: 46 },
  cloudBase: { ...part, left: 0, bottom: 0, width: 118, height: 30 },
  cloudLobeA: { ...part, left: 14, top: 0, width: 46, height: 46 },
  cloudLobeB: { ...part, left: 54, top: 8, width: 36, height: 36 },
});
