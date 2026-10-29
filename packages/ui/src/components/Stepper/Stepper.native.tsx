import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { resolveSteps, stepLabel } from './resolve-steps';
import { progressCounter, stepperPosition } from './Stepper.logic';
import type { StepperProps } from './Stepper.types';
import { StepperBars } from './StepperBars.native';
import { StepperIndicator } from './StepperIndicator.native';
import { StepperNumbered } from './StepperNumbered.native';
import { StepperRow } from './StepperRow.native';
import { isBarsVariant } from './stepper-bars';

interface NativeStepperProps extends StepperProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Wizard progress and step navigation. Four states per step; navigation always visible, and free
 * in any order unless the flow opts into `reachability="entered"`.
 */
export function Stepper({
  words,
  steps = [],
  current = 0,
  variant = 'progress',
  density = 'expressive',
  label,
  onStepClick,
  onOpenStepList,
  reachability = 'free',
  style,
}: NativeStepperProps) {
  const { total, index, percent, stepName } = stepperPosition(steps, current);
  /* The track and the dots are the control fill, the opposite of what holds them (`F7-15`). */
  const { controlFill } = useGround();

  if (isBarsVariant(variant)) {
    return (
      <StepperBars index={index} label={label} steps={steps} style={style} variant={variant} />
    );
  }

  if (variant === 'rail') {
    const resolved = resolveSteps(steps, current, reachability);
    return (
      <View style={style}>
        {label !== undefined ? (
          <Text variant="overline" color="tertiary" style={styles.railHeading}>
            {label}
          </Text>
        ) : null}
        {/* The web half is `<nav aria-label>` wrapping `<ol>`. RN has no landmark role, so the name
            rides the node that IS the list — a role, never `accessible`, since each row is its own
            Pressable and folding the rail would make every step unreachable. */}
        <View
          accessibilityRole="list"
          accessibilityLabel={label ?? words.steps}
          style={styles.list}
        >
          {resolved.map((step, position) => (
            <StepperRow
              key={step.label}
              connector
              current={index}
              index={position}
              onStepClick={onStepClick}
              step={step}
              total={total}
              words={words}
            />
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'indicator') {
    return (
      <StepperIndicator
        index={index}
        onOpenStepList={onOpenStepList}
        onStepClick={onStepClick}
        resolved={resolveSteps(steps, current, reachability)}
        style={style}
        words={words}
      />
    );
  }

  if (variant === 'progress') {
    return (
      <View style={style}>
        <View style={styles.head}>
          <Text variant="overline" color="tertiary">
            {progressCounter(words, index, total, label)}
          </Text>
          <Text variant="caption" color="secondary">
            {stepName}
          </Text>
        </View>
        <View
          style={[styles.track, { backgroundColor: controlFill }]}
          accessibilityRole="progressbar"
          accessibilityLabel={label ?? words.progress}
          accessibilityValue={{ min: 1, max: total, now: index + 1 }}
        >
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      </View>
    );
  }

  if (variant === 'dots') {
    return (
      // The web half is `role="group"`, which RN has no counterpart for. The dot strip states one
      // thing — how far along this is — so it takes the same `progressbar` + value the `progress`
      // branch above uses, which is the honest role and carries what web's per-dot `aria-current`
      // carries. Nothing inside is focusable, but this is still a role, not `accessible`.
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label ?? words.progress}
        accessibilityValue={{ min: 1, max: total, now: index + 1 }}
        style={[styles.dots, style]}
      >
        {steps.map((step, position) => (
          <View
            key={stepLabel(step)}
            style={[
              styles.dot,
              { backgroundColor: controlFill },
              position <= index ? styles.dotFilled : undefined,
              position === index ? styles.dotCurrent : undefined,
            ]}
          />
        ))}
        <Text variant="caption" color="secondary" style={styles.dotsName}>
          {stepName}
        </Text>
      </View>
    );
  }

  return (
    <StepperNumbered
      density={density}
      index={index}
      label={label}
      onStepClick={onStepClick}
      resolved={resolveSteps(steps, current, reachability)}
      style={style}
      words={words}
    />
  );
}

const styles = StyleSheet.create({
  railHeading: {
    marginBottom: 10,
    marginLeft: 10,
  },
  list: {
    flexDirection: 'column',
    gap: theme.spacing['sp-0-5'],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  track: {
    marginTop: 10,
    height: 6,
    borderRadius: theme.radius['r-pill'],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius['r-pill'],
  },
  dotFilled: {
    backgroundColor: theme.colors.accent,
  },
  dotCurrent: {
    width: 22,
  },
  dotsName: {
    marginLeft: theme.spacing['sp-2'],
  },
});
