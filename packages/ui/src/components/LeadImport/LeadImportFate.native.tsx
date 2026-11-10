import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { StageTrack } from '../StageTrack/StageTrack.native';
import { fateLineOf, fateMarkOf } from './LeadImport.logic';
import type { LeadImportRow, LeadImportWords } from './LeadImport.types';

/**
 * What happens to one row on the phone (`M02-20`, `M02-21`): its mark in a word, what the duplicate
 * choice does with it, and — for a number the company already has — the existing lead's three
 * facts: owner, stage, last contact. A lead outside the reader's list shows a lock and its owner.
 */
export function LeadImportFate({ row, words }: { row: LeadImportRow; words: LeadImportWords }) {
  const mark = fateMarkOf(row, words);
  const line = fateLineOf(row, words);
  return (
    <View style={styles.fate}>
      <View style={styles.wrapRow}>
        <StatusMark tone={mark.tone} label={mark.label} />
        {line === null ? null : (
          <Text variant="caption" color="secondary">
            {line}
          </Text>
        )}
      </View>
      {row.repeatsRow !== null ? (
        <Text variant="caption" color="secondary">
          {words.sameNumberTwice}
        </Text>
      ) : null}
      {row.match === null ? null : <LeadImportFacts row={row} words={words} />}
    </View>
  );
}

function LeadImportFacts({ row, words }: { row: LeadImportRow; words: LeadImportWords }) {
  const { match } = row;
  if (match === null) return null;
  const owner = (
    <View style={styles.fact}>
      {match.ownerName === null ? null : <Avatar name={match.ownerName} size={24} />}
      <Text variant="caption" color="secondary">
        {match.ownerName ?? words.noOwner}
      </Text>
    </View>
  );
  if (match.kind === 'out_of_scope') {
    return (
      <View style={styles.wrapRow}>
        <View style={styles.fact}>
          <ShellGlyph name="lock" size="sm" tone="secondary" />
          <Text variant="caption" color="secondary">
            {words.outside}
          </Text>
        </View>
        {owner}
      </View>
    );
  }
  return (
    <View style={styles.wrapRow}>
      {owner}
      <View style={styles.fact}>
        <StageTrack stage={match.stage} size="sm" words={words.stageTrack} />
        <Text variant="caption" color="secondary">
          {words.stage[match.stage]}
        </Text>
      </View>
      <View style={styles.fact}>
        <ShellGlyph name="clock" size="sm" tone="secondary" />
        <Text variant="caption" color="secondary">
          {words.lastContact(row.lastContactAgoMs)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fate: { gap: theme.spacing['sp-1'], minWidth: 0 },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-3'],
    rowGap: theme.spacing['sp-1'],
  },
  fact: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
});
