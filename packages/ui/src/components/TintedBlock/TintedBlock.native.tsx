import type { BlockTone } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { GroundProvider } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { Explainer } from '../Explainer/Explainer.native';
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
export function TintedBlock({
  tone,
  title,
  body,
  announce,
  heading = false,
  explainer,
  style,
}: NativeTintedBlockProps) {
  // An alert is said once on arrival and again only when its words change: a live region that
  // mounts already holding them stays silent, and iOS has none.
  useEffect(() => {
    if (announce === 'alert') {
      AccessibilityInfo.announceForAccessibility(body === undefined ? title : `${title}. ${body}`);
    }
  }, [announce, title, body]);
  const titleLine = (
    <Text
      variant={heading ? 'h3' : 'body-sm'}
      color={tone}
      bold={!heading}
      style={explainer === undefined ? undefined : styles.title}
    >
      {title}
    </Text>
  );
  return (
    <View
      style={[styles.block, TINT[tone], style]}
      accessibilityLiveRegion={announce === 'status' ? 'polite' : undefined}
    >
      {explainer === undefined ? (
        titleLine
      ) : (
        <GroundProvider ground="tile">
          <View style={styles.titleRow}>
            {titleLine}
            <Explainer {...explainer} inset />
          </View>
        </GroundProvider>
      )}
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
  /** The title and its ask share the row, the ask at its far end. */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  /** The title gives way and wraps, so a long one never pushes its ask off the block. */
  title: { flexShrink: 1 },
});
