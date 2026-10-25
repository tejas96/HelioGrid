import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { stepLabel } from './resolve-steps';
import type { StepperStep } from './Stepper.types';
import type { BarsVariant } from './stepper-bars';

interface BarsProps {
  steps: (StepperStep | string)[];
  index: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * `variant="bars"`: one thin bar per step, those done and the current one filled. The location
 * only — hidden from a screen reader, because the head above it names the step.
 */
function PlainBars({ steps, index, style }: BarsProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.bars, style]}
    >
      {steps.map((step, position) => (
        <View
          key={stepLabel(step)}
          style={[styles.bar, styles.segment, position <= index ? styles.barFilled : undefined]}
        />
      ))}
    </View>
  );
}

interface NumberedBarsProps extends BarsProps {
  label?: string;
}

/**
 * `variant="numbered-bars"`: the same bars with each step's number and name under its bar. The web
 * half is a `<nav>`, which RN has no role for; the steps' list takes the name, and the current
 * step says `selected` — the phone's spelling of `aria-current="step"`. A step holds no control,
 * so each column is one element.
 */
function NumberedBars({ steps, index, label, style }: NumberedBarsProps) {
  return (
    <View accessibilityRole="list" accessibilityLabel={label} style={[styles.numbered, style]}>
      {steps.map((step, position) => {
        const current = position === index;
        return (
          <View
            key={stepLabel(step)}
            accessible
            accessibilityState={{ selected: current }}
            style={styles.step}
          >
            <View style={[styles.bar, position <= index ? styles.barFilled : undefined]} />
            <View style={styles.caption}>
              <Text variant="caption" color={current ? 'primary' : 'secondary'} bold={current}>
                {String(position + 1)}
              </Text>
              <Text
                variant="caption"
                color={current ? 'primary' : 'secondary'}
                bold={current}
                style={styles.name}
              >
                {stepLabel(step)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

interface StepperBarsProps extends NumberedBarsProps {
  variant: BarsVariant;
}

/** `bars` or `numbered-bars` — `Stepper` hands both here. */
export function StepperBars({ variant, label, ...bars }: StepperBarsProps) {
  return variant === 'bars' ? <PlainBars {...bars} /> : <NumberedBars label={label} {...bars} />;
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    gap: theme.spacing['sp-1'],
  },
  segment: {
    flex: 1,
  },
  bar: {
    height: theme.spacing['sp-1'],
    borderRadius: theme.spacing['sp-0-5'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  barFilled: {
    backgroundColor: theme.colors.accent,
  },
  numbered: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: theme.spacing['sp-1'],
  },
  step: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 6,
  },
  caption: {
    flexDirection: 'row',
    gap: 6,
  },
  name: {
    flexShrink: 1,
  },
});
