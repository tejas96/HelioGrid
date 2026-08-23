import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { resolveSteps } from './resolve-steps';
import type { StepListProps } from './Stepper.types';
import { StepperRow } from './StepperRow.native';

interface NativeStepListProps extends StepListProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The step list itself — put it in a `Sheet` opened by `variant="indicator"`, which is the mobile
 * half of M05-03. Same reachability rule as `Stepper`; rows are 52dp.
 */
export function StepList({
  steps = [],
  current = 0,
  onStepClick,
  label,
  reachability = 'free',
  style,
}: NativeStepListProps) {
  const resolved = resolveSteps(steps, current, reachability);
  return (
    // The web half is an `<ol aria-label>`; `accessibilityRole="list"` is that node, and it is a
    // ROLE rather than `accessible` because every row below is its own focusable 52dp Pressable.
    <View
      accessibilityRole="list"
      accessibilityLabel={label ?? 'Steps'}
      style={[styles.list, style]}
    >
      {resolved.map((step, index) => (
        <StepperRow
          key={step.label}
          current={current}
          index={index}
          onStepClick={onStepClick}
          step={step}
          total={resolved.length}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'column',
    gap: theme.spacing['sp-0-5'],
  },
});
