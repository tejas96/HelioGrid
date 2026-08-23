import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { ResolvedStep } from './resolve-steps';

interface NativeStepperMarkerProps {
  index: number;
  size?: number;
  step: ResolvedStep;
}

/**
 * The step's glyph. Each state has its own — a tick, an exclamation, a number in an accent ring,
 * a hollow number — so a step's state is never carried by colour alone (F7-12).
 *
 * The in-progress ring is web's `box-shadow: 0 0 0 5px`; RN's `outline*` props are the one
 * equivalent that adds no layout, which the rail's connector geometry depends on.
 */
export function StepperMarker({ index, size = 28, step }: NativeStepperMarkerProps) {
  const shape = { width: size, height: size, minWidth: size, borderRadius: size / 2 };
  if (step.state === 'done' || step.state === 'errors') {
    const done = step.state === 'done';
    return (
      <View style={[styles.marker, shape, done ? styles.done : styles.errors]}>
        {done ? (
          <Svg
            width={13}
            height={13}
            viewBox="0 0 12 12"
            fill="none"
            stroke={theme.colors['text-inverse']}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M2.5 6.5 5 9l4.5-5" />
          </Svg>
        ) : (
          <Svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors['text-inverse']}
            strokeWidth={2.4}
            strokeLinecap="round"
          >
            <Path d="M12 7v6m0 3.5v.01" />
          </Svg>
        )}
      </View>
    );
  }
  const running = step.state === 'in-progress';
  return (
    <View style={[styles.marker, shape, running ? styles.running : styles.notStarted]}>
      <Text variant="caption" color={running ? 'accent' : 'tertiary'} style={styles.number}>
        {String(index + 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: theme.colors.surface,
  },
  done: {
    backgroundColor: theme.colors.success,
  },
  errors: {
    backgroundColor: theme.colors.danger,
  },
  running: {
    outlineWidth: 5,
    outlineColor: theme.colors['accent-subtle'],
    outlineStyle: 'solid',
  },
  notStarted: {
    borderWidth: 2,
    borderColor: theme.colors['canvas-sunken'],
  },
  number: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
