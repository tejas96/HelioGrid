import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider';
import type { OperationCount } from './OperationProgress.types';
import { ProgressRing } from './ProgressRing.native';
import { doneShare, RUN_RING } from './progress-ring';

interface OperationRingProps {
  label: ReactNode;
  count: OperationCount | null;
  countCaption?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * `size="ring"`: the run's ring, the done figure inside and the caller's caption under it. The
 * `progressbar` carries the count; without one it states no position. Only a string label can be
 * a phone's accessible name.
 */
export function OperationRing({ label, count, countCaption, style }: OperationRingProps) {
  const { number } = useFormat();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={typeof label === 'string' ? label : undefined}
      accessibilityValue={
        count === null ? undefined : { min: 0, max: count.total, now: count.done }
      }
      style={[styles.ring, style]}
    >
      <ProgressRing
        geometry={RUN_RING}
        share={count === null ? 0 : doneShare(count.done, count.total)}
        ink={theme.colors.accent}
      />
      <View style={styles.centre} pointerEvents="none">
        {count === null ? null : (
          <Text variant="h2" align="center" style={styles.figure}>
            {number(count.done)}
          </Text>
        )}
        {countCaption === undefined ? null : (
          <Text variant="caption" color="secondary" align="center">
            {countCaption}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignSelf: 'center',
    width: RUN_RING.box,
    height: RUN_RING.box,
  },
  centre: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-0-5'],
  },
  figure: {
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
});
