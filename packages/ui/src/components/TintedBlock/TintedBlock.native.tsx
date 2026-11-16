import { theme } from '@heliogrid/theme';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { GroundProvider } from '../../primitives/Ground/Ground.native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { Explainer } from '../Explainer/Explainer.native';
import type { TintedBlockProps } from './TintedBlock.types';

interface NativeTintedBlockProps extends TintedBlockProps {
  style?: StyleProp<ViewStyle>;
}

/** The tinted block above a locked code field or under a finding: the words carry the reason, the tint is the second channel. */
export function TintedBlock({
  tone,
  title,
  body,
  announce,
  heading = false,
  explainer,
  face = 'sans',
  children,
  rise = false,
  style,
}: NativeTintedBlockProps) {
  // An alert is said once on arrival and again only when its words change: a live region that
  // mounts already holding them stays silent, and iOS has none.
  useEffect(() => {
    if (announce === 'alert') {
      AccessibilityInfo.announceForAccessibility(body === undefined ? title : `${title}. ${body}`);
    }
  }, [announce, title, body]);
  const display = face === 'display' && !heading;
  const titleLine = (
    <Text
      variant={heading ? 'h3' : display ? 'h2' : 'body-sm'}
      color={display ? 'primary' : TITLE_INK[tone]}
      bold={!heading && !display}
      style={[
        display ? styles.display : undefined,
        explainer === undefined ? undefined : styles.title,
      ]}
    >
      {title}
    </Text>
  );
  const block = (
    <View
      style={[
        styles.block,
        /* The room follows the face, as the web's `data-face` does, heading or not. */
        face === 'display' ? styles.roomy : undefined,
        { backgroundColor: TONE[tone].tint },
        style,
      ]}
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
      {children}
    </View>
  );
  return rise ? <Rising order={0}>{block}</Rising> : block;
}

/** A title's ink: the tone's own, and a neutral note's the secondary words. */
const TITLE_INK = {
  danger: 'danger',
  warning: 'warning',
  info: 'info',
  success: 'success',
  neutral: 'secondary',
} as const;

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
  /** A note a customer reads: the room of a card. */
  roomy: { gap: theme.spacing['sp-2'], padding: theme.spacing['sp-5'] },
  /** Its serif card title, as `CardHeader`'s `display` face. */
  display: {
    fontFamily: theme.type.families.display,
    fontWeight: '400',
    fontSize: theme.type.roles['card-title'].fontSize,
    lineHeight: theme.type.roles['card-title'].lineHeight,
    letterSpacing: theme.type.roles['card-title'].letterSpacing,
  },
});
