import type { TranslatedText } from '@heliogrid/contracts';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { ResolvedStep } from './resolve-steps';
import { isLastStep, isStepClickable, markerSizeFor } from './Stepper.logic';
import type { StepperDensity, StepperWords } from './Stepper.types';
import { StepperNumberedItem } from './StepperNumberedItem.native';

interface NativeStepperNumberedProps {
  density: StepperDensity;
  index: number;
  label?: TranslatedText;
  onStepClick?: (index: number) => void;
  resolved: readonly ResolvedStep[];
  style?: StyleProp<ViewStyle>;
  words: StepperWords;
}

/** The horizontal arrangement: a marker per step with a connector line between them. */
export function StepperNumbered({
  density,
  index,
  label,
  onStepClick,
  resolved,
  style,
  words,
}: NativeStepperNumberedProps) {
  const total = resolved.length;
  const markerSize = markerSizeFor(density);
  return (
    // `<ol aria-label>` on the web half. A role, not `accessible`: each marker below is its own
    // 44dp Pressable, and folding them into one element would put every step out of reach.
    <View
      accessibilityRole="list"
      accessibilityLabel={label ?? words.progress}
      style={[styles.list, style]}
    >
      {resolved.map((step, position) => (
        <StepperNumberedItem
          key={step.label}
          active={position === index}
          index={position}
          last={isLastStep(position, total)}
          markerSize={markerSize}
          onPress={
            isStepClickable(step, onStepClick !== undefined)
              ? () => onStepClick?.(position)
              : undefined
          }
          step={step}
          tight={density === 'functional'}
          total={total}
          words={words}
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
