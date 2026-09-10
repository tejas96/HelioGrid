import type { FrameTone } from '@heliogrid/domain';
import { Text } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/** The tinted block above a locked code field: the words carry the reason, the tint is the second channel. */
export function TintedBlock({
  tone,
  title,
  body,
}: {
  tone: FrameTone;
  title: string;
  body: string;
}) {
  return (
    <View style={[styles.tinted, tone === 'danger' ? styles.tintedDanger : styles.tintedWarning]}>
      <Text variant="body-sm" color={tone}>
        {title}
      </Text>
      <Text variant="caption" color="secondary">
        {body}
      </Text>
    </View>
  );
}
