import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { BrandGradientFill } from '../ProgressBar/BrandGradientFill.native';
import type { SignupStepsProps } from './SignupSteps.types';

/**
 * The step said quietly: the counter and the step's name as one overline, over a rail of three
 * tracks — the done ones filled with the logo's light, the one in view filling as the step opens.
 */
export function SignupSteps({ words, current }: SignupStepsProps) {
  const total = words.steps.length;
  return (
    <View style={styles.lead} accessible accessibilityLabel={words.label}>
      <View style={styles.words}>
        <Text variant="overline" color="secondary">
          {words.stepper.counter({ current: current + 1, total })}
        </Text>
        <View style={styles.separator} />
        <Text variant="overline" color="secondary">
          {words.steps[current]}
        </Text>
      </View>
      <View style={styles.rail}>
        {words.steps.map((step, index) => (
          <View key={step} style={styles.track}>
            {index < current ? <Filled /> : null}
            {index === current ? <Filling /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function Filled() {
  return (
    <View style={styles.fill}>
      <BrandGradientFill />
    </View>
  );
}

/** The track in view fills from its start once, on the UI thread; at once under reduced motion. */
function Filling() {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: theme.motion.durations.ambient,
      delay: theme.motion.durations.standard,
      easing: Easing.bezier(...theme.motion.easings.enter),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, reduced]);
  return (
    <Animated.View style={[styles.fill, styles.fromStart, { transform: [{ scaleX: progress }] }]}>
      <BrandGradientFill />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lead: { gap: theme.spacing['sp-3'] },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  separator: {
    width: 3,
    height: 3,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['text-secondary'],
  },
  rail: { flexDirection: 'row', gap: theme.spacing['sp-2'] },
  track: {
    flex: 1,
    height: theme.spacing['sp-1'],
    overflow: 'hidden',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['line-soft'],
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: theme.radius['r-pill'],
  },
  /* The fill grows from the track's start, as the web's `transform-origin: left`. */
  fromStart: { transformOrigin: 'left center' },
});
