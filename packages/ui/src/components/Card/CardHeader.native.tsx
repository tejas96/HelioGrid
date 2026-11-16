import { theme } from '@heliogrid/theme';
import type { Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { CardHeaderProps } from './Card.types';

interface NativeCardHeaderProps extends CardHeaderProps {
  /** Where the screen reader lands when one of the card's acts leaves after its press. */
  headingRef?: Ref<View>;
  style?: StyleProp<ViewStyle>;
}

/* The title is `h3`'s weight and line box at the card head's size: the line box is the bundled face's
   own, so a Devanagari mark is never clipped. */
const HEAD = theme.type.roles['card-head'];
const CARD_TITLE = theme.type.roles['card-title'];

/** A card's head on the phone: its title, the quiet line under it, its one act at the end. */
export function CardHeader({
  title,
  description = null,
  action = null,
  lead = null,
  face = 'sans',
  headingRef,
  style,
}: NativeCardHeaderProps) {
  return (
    <View style={[styles.head, style]}>
      {lead === null ? null : <View style={styles.lead}>{lead}</View>}
      <View style={styles.words}>
        <View ref={headingRef} accessible accessibilityRole="header">
          <Text variant="h3" style={face === 'display' ? styles.titleDisplay : styles.title}>
            {title}
          </Text>
        </View>
        {description === null ? null : (
          <Text variant="body-sm" color="tertiary">
            {description}
          </Text>
        )}
      </View>
      {action === null ? null : <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-4'],
  },
  lead: { flexShrink: 0 },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  title: { fontSize: HEAD.fontSize, letterSpacing: HEAD.letterSpacing },
  titleDisplay: {
    fontFamily: theme.type.families.display,
    fontWeight: '400',
    fontSize: CARD_TITLE.fontSize,
    letterSpacing: CARD_TITLE.letterSpacing,
  },
  action: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});
