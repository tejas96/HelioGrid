import { theme } from '@heliogrid/tokens/theme';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, type TextStyle } from 'react-native';
import { AppText, BloomLayer } from '../ui';

/**
 * Screen-local support for LoginScreen (split to respect the ~450-line file cap):
 * typography shorthands, reduced-motion hook, the DS step-mount rise and the ambient
 * brand-bloom backdrop. Nothing here is shared vocabulary — promotion into src/ui
 * needs an owner ruling.
 */

// ds-ref LoginFlow mobile bloom geometry + 8s ambient loop (login.md §2 spec constants).
const BLOOM_SIZE = 520;
const BLOOM_TOP = -150;
const BLOOM_LOOP_MS = 8000;

export function H1({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return (
    // biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role (TypeRole), not ARIA — RN has no DOM roles
    <AppText role="h1" weight="700" style={style}>
      {children}
    </AppText>
  );
}

export function Small({
  children,
  color,
  weight,
  mono,
}: {
  children: ReactNode;
  color?: string;
  weight?: '400' | '500' | '600' | '700';
  mono?: boolean;
}) {
  return (
    // biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role (TypeRole), not ARIA — RN has no DOM roles
    <AppText role="body-sm" color={color} weight={weight} mono={mono} style={styles.small}>
      {children}
    </AppText>
  );
}

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduce(v);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return reduce;
}

/** Step bodies mount with the DS card-mount motion: fade + 8dp rise, 320ms ease-enter. */
export function StepRise({
  children,
  reduceMotion,
}: {
  children: ReactNode;
  reduceMotion: boolean;
}) {
  const anim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(1);
      return;
    }
    Animated.timing(anim, {
      toValue: 1,
      duration: theme.motion.durations.emphasised,
      easing: Easing.bezier(...theme.motion.easings.enter),
      useNativeDriver: true,
    }).start();
  }, [anim, reduceMotion]);
  return (
    <Animated.View
      style={[
        styles.step,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.spacing['sp-2'], 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Brand bloom (atmosphere, never information): 8s scale/opacity ambient loop. */
export function BloomBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const ease = Easing.bezier(...theme.motion.easings.standard);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: BLOOM_LOOP_MS / 2,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: BLOOM_LOOP_MS / 2,
          easing: ease,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, reduceMotion]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bloom,
        {
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] }) }],
        },
      ]}
    >
      <BloomLayer size={BLOOM_SIZE} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  small: { flexShrink: 1 },
  step: { width: '100%' },
  bloom: {
    position: 'absolute',
    top: BLOOM_TOP,
    left: '50%',
    marginLeft: -BLOOM_SIZE / 2,
  },
});
