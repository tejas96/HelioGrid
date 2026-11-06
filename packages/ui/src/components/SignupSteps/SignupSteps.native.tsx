import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import type { SignupStepsProps } from './SignupSteps.types';

/** The step said quietly: the counter and the step's name as one overline, and a dot per step. */
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
      <View style={styles.dots}>
        {words.steps.map((step, index) => (
          <View
            key={step}
            style={[
              styles.dot,
              index < current ? styles.done : index === current ? styles.current : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const DOT = 6;

const styles = StyleSheet.create({
  lead: { gap: theme.spacing['sp-2'] },
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
  dots: { flexDirection: 'row', gap: theme.spacing['sp-1'] },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['line-strong'],
  },
  done: { backgroundColor: colors.ink },
  current: { width: DOT * 3, backgroundColor: colors.accent },
});
