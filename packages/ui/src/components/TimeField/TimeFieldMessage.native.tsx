import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { hasCallerError } from './TimeField.logic';

interface NativeTimeFieldMessageProps {
  error?: ReactNode;
  helper?: TranslatedText;
  refused: TranslatedText | null;
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
        <Text variant="field-helper" color="danger">
          {refused}
        </Text>
      </View>
    );
  }
  if (hasCallerError(error)) {
    return (
      <Text variant="field-helper" color="danger">
        {error}
      </Text>
    );
  }
  if (helper !== undefined) {
    return (
      <Text variant="field-helper" color="tertiary">
        {helper}
      </Text>
    );
  }
  return null;
}
