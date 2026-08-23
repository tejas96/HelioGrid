import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';

interface NumberFieldMessageProps {
  refused: ReactNode;
  error: ReactNode;
  correction: string | null;
  hint?: string;
}

const styles = StyleSheet.create({
  slot: { marginTop: 6, marginHorizontal: 2 },
});

/**
 * The one message slot. Precedence: refusal → error → correction → hint.
 *
 * A refusal is announced (`accessibilityLiveRegion="assertive"`, RN's `role="alert"`), a
 * correction is announced politely, and an `error` is DESCRIBED rather than announced — it was
 * already true when the jump landed on the field, so it is what the field IS, not news.
 */
export function NumberFieldMessage({ refused, error, correction, hint }: NumberFieldMessageProps) {
  if (refused !== null) {
    return (
      <View
        style={styles.slot}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        accessible
      >
        {typeof refused === 'string' ? (
          <Text variant="caption" color="danger">
            {refused}
          </Text>
        ) : (
          refused
        )}
      </View>
    );
  }
  if (error !== undefined) {
    return (
      <View style={styles.slot} accessible>
        {typeof error === 'string' ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : (
          error
        )}
      </View>
    );
  }
  if (correction !== null) {
    return (
      <View style={styles.slot} accessibilityLiveRegion="polite" accessible>
        <Text variant="caption" color="warning">
          {correction}
        </Text>
      </View>
    );
  }
  if (hint !== undefined) {
    return (
      <View style={styles.slot}>
        <Text variant="caption" color="tertiary">
          {hint}
        </Text>
      </View>
    );
  }
  return null;
}
