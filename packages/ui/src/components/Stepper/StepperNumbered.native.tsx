import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { ResolvedStep } from './resolve-steps';
import type { StepperDensity } from './Stepper.types';
import { StepperNumberedItem } from './StepperNumberedItem.native';

interface NativeStepperNumberedProps {
  density: StepperDensity;
  index: number;
  label?: string;
  onStepClick?: (index: number) => void;
  resolved: readonly ResolvedStep[];
  style?: StyleProp<ViewStyle>;
}

/** The horizontal arrangement: a marker per step with a connector line between them. */
export function StepperNumbered({
  density,
  index,
  label,
  onStepClick,
  resolved,
  style,
}: NativeStepperNumberedProps) {
  const total = resolved.length;
  const markerSize = density === 'functional' ? 24 : 28;
  return (
    // `<ol aria-label>` on the web half. A role, not `accessible`: each marker below is its own
    // 44dp Pressable, and folding them into one element would put every step out of reach.
    <View
      accessibilityRole="list"
      accessibilityLabel={label ?? 'Progress'}
      style={[styles.list, style]}
    >
      {resolved.map((step, position) => (
        <StepperNumberedItem
          key={step.label}
          active={position === index}
          index={position}
          last={position === total - 1}
          markerSize={markerSize}
          onPress={
            onStepClick !== undefined && step.reachable ? () => onStepClick(position) : undefined
          }
          step={step}
          tight={density === 'functional'}
          total={total}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
