import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { stepLabel } from './resolve-steps';
import type { StepperStep } from './Stepper.types';
import type { BarsVariant } from './stepper-bars';

interface BarsProps {
  steps: (StepperStep | TranslatedText)[];
  index: number;
  /** The bar in view fills from its start once (`StepperProps.fillIn`). */
  fillIn: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The bar in view filling from its start once, on the UI thread; at once under reduced motion. */
function FillingIn() {
  const reduced = useReducedMotion();
  const grow = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      grow.setValue(1);
      return;
    }
    const anim = Animated.timing(grow, {
      toValue: 1,
      duration: theme.motion.durations.ambient,
      delay: theme.motion.durations.standard,
      easing: Easing.bezier(...theme.motion.easings.enter),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [grow, reduced]);
  return <Animated.View style={[styles.fillIn, { transform: [{ scaleX: grow }] }]} />;
}

/** One bar: filled when done or in view; the one in view, when it fills in, grows from its start. */
function Bar({
  position,
  index,
  fillIn,
  style,
}: {
  position: number;
  index: number;
  fillIn: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const growing = fillIn && position === index;
  return (
    <View style={[styles.bar, style, position <= index && !growing ? styles.barFilled : undefined]}>
      {growing ? <FillingIn /> : null}
    </View>
  );
}

/**
 * `variant="bars"`: one thin bar per step, those done and the current one filled. The location
 * only — hidden from a screen reader, because the head above it names the step.
 */
function PlainBars({ steps, index, fillIn, style }: BarsProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.bars, style]}
    >
      {steps.map((step, position) => (
        <Bar
          key={stepLabel(step)}
          position={position}
          index={index}
          fillIn={fillIn}
          style={styles.segment}
        />
      ))}
    </View>
  );
}

interface NumberedBarsProps extends BarsProps {
  label?: TranslatedText;
}

/**
 * `variant="numbered-bars"`: the same bars with each step's number and name under its bar. The web
 * half is a `<nav>`, which RN has no role for; the steps' list takes the name, and the current
 * step says `selected` — the phone's spelling of `aria-current="step"`. A step holds no control,
 * so each column is one element.
 */
function NumberedBars({ steps, index, fillIn, label, style }: NumberedBarsProps) {
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
            <Bar position={position} index={index} fillIn={fillIn} />
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
    overflow: 'hidden',
    height: theme.spacing['sp-1'],
    borderRadius: theme.spacing['sp-0-5'],
    backgroundColor: colors['canvas-sunken'],
  },
  barFilled: {
    backgroundColor: colors.accent,
  },
  /* The fill grows from the bar's start, as the web's `transform-origin: left`. */
  fillIn: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: theme.spacing['sp-0-5'],
    backgroundColor: colors.accent,
    transformOrigin: 'left center',
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
