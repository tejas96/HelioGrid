import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ResolvedStep } from './resolve-steps';
import { stateWord } from './resolve-steps';
import { StepperMarker } from './StepperMarker.native';

interface NativeStepperRowProps {
  connector?: boolean;
  current: number;
  index: number;
  onStepClick?: (index: number) => void;
  step: ResolvedStep;
  total: number;
}

/** One row per step — the body of the mobile step-list sheet, and the desktop rail's row. */
export function StepperRow({
  connector = false,
  current,
  index,
  onStepClick,
  step,
  total,
}: NativeStepperRowProps) {
  const clickable = onStepClick !== undefined && step.reachable;
  const word = stateWord(step);
  const active = index === current;
  /* The connector is the control fill, the opposite of what holds it (`F7-15`). */
  const { controlFill } = useGround();
  return (
    <View style={styles.item}>
      {connector && index < total - 1 ? (
        <View
          style={[
            styles.connector,
            { backgroundColor: controlFill },
            step.state === 'done' ? styles.connectorDone : undefined,
          ]}
        />
      ) : null}
      <Pressable
        accessibilityLabel={`Step ${index + 1} of ${total}, ${step.label}, ${word.toLowerCase()}`}
        disabled={!clickable}
        onPress={clickable ? () => onStepClick(index) : undefined}
        style={[styles.row, active ? styles.rowActive : undefined]}
      >
        <StepperMarker index={index} step={step} />
        <View style={styles.body}>
          <Text
            variant="body-sm"
            /* A step not yet reached is read, not quiet (`N4`) — the web half's secondary. */
            color={step.state === 'not-started' ? 'secondary' : 'primary'}
            style={active ? styles.nameActive : styles.name}
          >
            {step.label}
          </Text>
          <Text variant="caption" color={wordColor(step)}>
            {step.optional === true ? `${word} · optional` : word}
          </Text>
        </View>
        {clickable && !active ? (
          <Svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors['text-tertiary']}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="m9 18 6-6-6-6" />
          </Svg>
        ) : null}
      </Pressable>
    </View>
  );
}

function wordColor(step: ResolvedStep): 'danger' | 'success' | 'tertiary' {
  if (step.state === 'errors') {
    return 'danger';
  }
  return step.state === 'done' ? 'success' : 'tertiary';
}

const styles = StyleSheet.create({
  item: {
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 21,
    top: 42,
    bottom: -6,
    width: 2,
    borderRadius: 2,
  },
  connectorDone: {
    backgroundColor: theme.colors.success,
    opacity: 0.35,
  },
  row: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius['r-md'],
  },
  rowActive: {
    backgroundColor: theme.colors['accent-subtle'],
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  /* 14 is off the DS type ladder; body-sm (13) is the nearest role and carries the step name. */
  name: {
    fontSize: 14,
  },
  nameActive: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: theme.type.roles.button.letterSpacing,
  },
});
