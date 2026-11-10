import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { IconCircle } from '../Card/Card.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { actLineOf, choiceLookOf, isActWaiting } from './DedupeSheet.logic';
import type { DedupeChoiceProps } from './DedupeSheet.types';

/**
 * One of the sheet's three choices: its mark, its title, the one line under it, and — when
 * its act is out or came back — that line in its place beneath.
 */
export function DedupeChoice({
  choice,
  choiceWords,
  record,
  act,
  onPress,
  expanded,
  words,
}: DedupeChoiceProps) {
  const look = choiceLookOf(choice, record);
  const line = actLineOf(choice, act, words);
  return (
    <View style={styles.slot}>
      <Pressable
        onPress={onPress}
        accessibilityState={{ busy: isActWaiting(act) && act?.choice === choice, expanded }}
        style={styles.choice}
      >
        <IconCircle color={look.circle} size={44}>
          <ShellGlyph name={look.glyph} size="md" tone={look.tone} />
        </IconCircle>
        <View style={styles.words}>
          <Text variant="body" bold>
            {choiceWords.title}
          </Text>
          <Text variant="body-sm" color="secondary">
            {choiceWords.line}
          </Text>
        </View>
        <View style={expanded === true ? styles.turned : undefined}>
          <ShellGlyph
            name={expanded === undefined ? 'chevron-right' : 'chevron'}
            size="sm"
            tone="secondary"
          />
        </View>
      </Pressable>
      {line === null ? null : <PendingAction {...line} />}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { gap: theme.spacing['sp-1'] },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-16'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
    backgroundColor: colors.fill,
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  turned: { transform: [{ rotate: '180deg' }] },
});
