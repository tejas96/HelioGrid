import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { narrationShape } from './operation-progress-model';

interface OperationNarrationProps {
  /** "Step 2 of 3", when the caller has both halves. */
  step: string | null;
  stage: ReactNode;
  /** "142 of 400 rows", printed in mono. */
  counted: string | null;
}

/**
 * STAGE NARRATION IS NOT DECORATION. A percentage says how far; only words say what is happening,
 * and on a 40-second solar-access run the words are the whole reason the wait is tolerable.
 */
export function OperationNarration({ step, stage, counted }: OperationNarrationProps) {
  const shape = narrationShape(step, stage, counted);
  if (shape === null) {
    return null;
  }
  return (
    <View accessibilityLiveRegion="polite" style={styles.narration}>
      {shape.narrates ? (
        <View style={styles.words}>
          {step !== null ? (
            <Text variant="caption" color="secondary">
              {step}
            </Text>
          ) : null}
          {shape.joins ? (
            <Text variant="caption" color="secondary">
              {' · '}
            </Text>
          ) : null}
          {typeof stage === 'string' || typeof stage === 'number' ? (
            <Text variant="caption" style={secondary}>
              {stage}
            </Text>
          ) : (
            stage
          )}
        </View>
      ) : null}
      {counted !== null ? (
        <Text variant="mono" color="tertiary">
          {counted}
        </Text>
      ) : null}
    </View>
  );
}

const secondary: TextStyle = { color: theme.colors['text-secondary'] };

const styles = StyleSheet.create({
  narration: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 10,
  },
  words: { flexDirection: 'row', flexShrink: 1, minWidth: 0 },
});
