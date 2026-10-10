import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Stepper } from '../Stepper/Stepper.native';
import type { SignupStepsProps } from './SignupSteps.types';

/** The track and its counter over the step (`SCR-M01-02` decision 4). */
export function SignupSteps({ words, current }: SignupStepsProps) {
  return (
    <View style={styles.lead}>
      <Stepper
        variant="progress"
        label={words.label}
        steps={[...words.steps]}
        current={current}
        reachability="entered"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /** `sp-6` under the header row (the export's lead block). */
  lead: { paddingTop: theme.spacing['sp-6'] },
});
