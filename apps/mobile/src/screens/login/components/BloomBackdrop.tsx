import { theme } from '@heliogrid/tokens/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { BloomLayer } from '../../../ui';

// ds-ref LoginFlow mobile bloom geometry + 8s ambient loop (login.md §2 spec constants).
const BLOOM_SIZE = 520;
const BLOOM_TOP = -150;
const BLOOM_LOOP_MS = 8000;

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
        localStyles.bloom,
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

const localStyles = StyleSheet.create({
  bloom: {
    position: 'absolute',
    top: BLOOM_TOP,
    left: '50%',
    marginLeft: -BLOOM_SIZE / 2,
  },
});
