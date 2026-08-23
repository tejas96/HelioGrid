import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';

interface NativeTimeFieldMessageProps {
  error?: ReactNode;
  helper?: string;
  refused: string | null;
}

/**
 * Precedence: refusal → error → helper.
 *
 * A refusal happened just now and is ANNOUNCED — the Text primitive carries no a11y role, so the
 * live region is the view around it. An `error` is the gate's verdict, already true when the jump
 * landed here, so it is only read in order.
 */
export function TimeFieldMessage({ error, helper, refused }: NativeTimeFieldMessageProps) {
  if (refused !== null) {
    return (
      <View accessibilityRole="alert" accessibilityLiveRegion="assertive">
        <Text variant="caption" color="danger">
          {refused}
        </Text>
      </View>
    );
  }
  if (error !== undefined && error !== null && error !== false) {
    return (
      <Text variant="caption" color="danger">
        {error}
      </Text>
    );
  }
  if (helper !== undefined) {
    return (
      <Text variant="caption" color="tertiary">
        {helper}
      </Text>
    );
  }
  return null;
}
