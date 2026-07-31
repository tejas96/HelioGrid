import { theme } from '@heliogrid/tokens/theme';
import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { styles } from '../styles';

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
