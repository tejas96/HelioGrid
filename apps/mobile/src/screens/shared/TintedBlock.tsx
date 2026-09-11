import type { FrameTone } from '@heliogrid/domain';
import { Text } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from './door-styles';

/** The block's tint: the door's two refusal tones, and `info` for a finding that is a steer, not a refusal (`SCR-M01-02`). */
export type BlockTone = FrameTone | 'info';

const TINT = {
  danger: styles.tintedDanger,
  warning: styles.tintedWarning,
  info: styles.tintedInfo,
} as const;

/** The tinted block above a locked code field or under a finding: the words carry the reason, the tint is the second channel. */
export function TintedBlock({
  tone,
  title,
  body,
}: {
  tone: BlockTone;
  title: string;
  body: string;
}) {
  return (
    <View style={[styles.tinted, TINT[tone]]}>
      <Text variant="body-sm" color={tone}>
        {title}
      </Text>
      <Text variant="caption" color="secondary">
        {body}
      </Text>
    </View>
  );
}
