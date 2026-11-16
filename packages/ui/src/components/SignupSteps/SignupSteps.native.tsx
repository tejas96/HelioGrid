import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { Stepper } from '../Stepper/Stepper.native';
import type { SignupStepsProps } from './SignupSteps.types';

/**
 * The step said quietly: the counter and the step's name as one overline, over the `Stepper`'s
 * bars — the done ones filled, the one in view filling once. The phone has no room for the names; the
 * overline says the one in view.
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
      <Stepper
        variant="bars"
        words={words.stepper}
        steps={[...words.steps]}
        current={current}
        fillIn
      />
    </View>
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
});
