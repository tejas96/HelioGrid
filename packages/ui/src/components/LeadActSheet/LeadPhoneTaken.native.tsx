import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import type { LeadContactWords } from './LeadActSheet.parts.types';
import type { LeadPhoneTaken } from './LeadActSheet.types';

/**
 * The refusal of a contact whose number is another customer's (`M02-02`): nothing was saved; the
 * record by name — or that it is outside the person's list — its owner, stage and last contact,
 * and Merge where the person may reach that record.
 */
export function LeadPhoneTakenNote({
  taken,
  words,
}: {
  taken: LeadPhoneTaken;
  words: LeadContactWords;
}) {
  return (
    <View style={styles.note} accessibilityLiveRegion="polite">
      <View style={styles.head}>
        <ShellGlyph name="alert" size="md" tone="warning" />
        <View style={styles.words}>
          <Text variant="body" bold>
            {words.takenTitle}
          </Text>
          <Text variant="body-sm" color="secondary">
            {words.takenLine}
          </Text>
        </View>
      </View>
      <Text variant="body-sm" bold>
        {taken.name ?? words.outside}
      </Text>
      <FactRows density="functional">
        <FactRow label={words.ownerLabel} value={taken.ownerName ?? words.noOwner} />
        <FactRow label={words.stageLabel} value={words.stage(taken.stage)} />
        <FactRow label={words.lastContactLabel} value={taken.lastContact} />
      </FactRows>
      {taken.onMerge === null ? null : (
        <Button variant="secondary" size="md" onClick={taken.onMerge}>
          {words.merge}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-functional'],
    borderWidth: 1,
    borderColor: colors['warning-text'],
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
