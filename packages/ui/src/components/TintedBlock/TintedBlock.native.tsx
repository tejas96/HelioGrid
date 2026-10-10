import type { BlockTone } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TintedBlockProps } from './TintedBlock.types';

interface NativeTintedBlockProps extends TintedBlockProps {
  style?: StyleProp<ViewStyle>;
}

/* Every tone is its -bg token: the tint is the second channel, the words are the message. */
const TINT: Record<BlockTone, ViewStyle> = {
  danger: { backgroundColor: theme.colors['danger-bg'] },
  warning: { backgroundColor: theme.colors['warning-bg'] },
  info: { backgroundColor: theme.colors['info-bg'] },
};

/** The tinted block above a locked code field or under a finding: the words carry the reason, the tint is the second channel. */
export function TintedBlock({ tone, title, body, announce, style }: NativeTintedBlockProps) {
  // An alert is said once on arrival and again only when its words change: a live region that
  // mounts already holding them stays silent, and iOS has none.
  useEffect(() => {
    if (announce === 'alert') {
      AccessibilityInfo.announceForAccessibility(body === undefined ? title : `${title}. ${body}`);
    }
  }, [announce, title, body]);
  return (
    <View
      style={[styles.block, TINT[tone], style]}
      accessibilityLiveRegion={announce === 'status' ? 'polite' : undefined}
    >
      <Text variant="body-sm" color={tone} bold>
        {title}
      </Text>
      {body === undefined ? null : (
        <Text variant="caption" color="secondary">
          {body}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: theme.spacing['sp-1'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
});
