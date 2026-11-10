import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { IconCircle } from '../Card/Card.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { StageTrack } from '../StageTrack/StageTrack.native';
import type { DedupeSheetProps } from './DedupeSheet.types';

type DedupeRecordProps = Pick<DedupeSheetProps, 'record' | 'ownerName' | 'stage' | 'words'>;

/**
 * The existing record and its three facts (`M02-08`): who it is when the person may open it, a
 * lock and nothing of it when they may not — and in both, owner, stage and last contact.
 */
export function DedupeRecord({ record, ownerName, stage, words }: DedupeRecordProps) {
  return (
    <View style={styles.record}>
      {record.kind === 'visible' ? (
        <View style={styles.who}>
          <Avatar name={record.name ?? undefined} size={40} />
          <View style={styles.words}>
            {record.name === null ? (
              <NamedGap gap={words.noName} />
            ) : (
              <Text variant="body" bold>
                {record.name}
              </Text>
            )}
            {record.city === null ? (
              <NamedGap gap={words.noCity} />
            ) : (
              <Text variant="body-sm" color="secondary">
                {record.city}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.who}>
          <IconCircle color={colors['text-secondary']} size={40}>
            <ShellGlyph name="lock" size="md" tone="secondary" />
          </IconCircle>
          <View style={styles.words}>
            <Text variant="body" bold>
              {words.outsideTitle}
            </Text>
            <Text variant="body-sm" color="secondary">
              {words.outsideLine}
            </Text>
          </View>
        </View>
      )}
      <FactRows density="functional">
        <FactRow
          label={words.ownerLabel}
          mark={<ShellGlyph name="person" size="sm" tone="secondary" />}
          value={
            ownerName === null ? (
              words.noOwner
            ) : (
              <View style={styles.fact}>
                <Avatar name={ownerName} size={24} />
                <Text variant="body-sm">{ownerName}</Text>
              </View>
            )
          }
        />
        <FactRow
          label={words.stageLabel}
          mark={<ShellGlyph name="flag" size="sm" tone="secondary" />}
          value={
            <View style={styles.fact}>
              <StageTrack stage={stage} words={words.stageTrack} />
              <Text variant="body-sm">{words.stage}</Text>
            </View>
          }
        />
        <FactRow
          label={words.lastContactLabel}
          mark={<ShellGlyph name="clock" size="sm" tone="secondary" />}
          value={words.lastContact}
        />
      </FactRows>
    </View>
  );
}

const styles = StyleSheet.create({
  record: { gap: theme.spacing['sp-3'] },
  who: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  fact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing['sp-2'],
  },
});
