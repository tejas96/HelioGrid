import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { Avatar } from '../Avatar/Avatar.native';
import { CardRow } from '../CardRows/CardRows.native';
import { LeadSourceMark } from '../LeadSourceMark/LeadSourceMark.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { StageTrack } from '../StageTrack/StageTrack.native';
import { leadNextToneOf } from './LeadListRow.logic';
import type { LeadListRowProps, LeadNextMarkProps } from './LeadListRow.types';

/** What comes next on a lead, as glyph, word and tint. */
export function LeadNextMark(props: LeadNextMarkProps) {
  return <StatusMark tone={leadNextToneOf(props)} label={props.label} />;
}

/** One lead of the list on the phone: the whole row opens it; the bill and the owner at its end. */
export function LeadListRow({ lead, sourceLabel, next, first, onOpen, words }: LeadListRowProps) {
  return (
    <CardRow first={first} open={{ name: words.open(lead.name), onOpen }}>
      <View style={styles.row}>
        <Avatar name={lead.name ?? undefined} size={40} />
        <View style={styles.main}>
          {lead.name === null ? (
            <NamedGap gap={words.noName} scale="field" />
          ) : (
            <Text variant="body" bold>
              {lead.name}
            </Text>
          )}
          <View style={styles.sub}>
            <LeadSourceMark source={lead.source} label={sourceLabel} form="glyph" />
            <StageTrack stage={lead.stage} size="sm" words={words.track} />
            <Text variant="body-sm" color="secondary">
              {words.stage(lead.stage)}
            </Text>
            {lead.city === null ? (
              <NamedGap gap={words.noCity} scale="cell" />
            ) : (
              <Text variant="body-sm" color="secondary">
                {lead.city}
              </Text>
            )}
          </View>
          {next === null ? null : (
            <View style={styles.next}>
              <LeadNextMark {...next} />
            </View>
          )}
        </View>
        <View style={styles.end}>
          {lead.bill === null ? (
            <NamedGap gap={words.noBill} scale="cell" align="right" />
          ) : (
            <Text variant="mono">{lead.bill}</Text>
          )}
          {lead.owner === null ? (
            <NamedGap gap={words.noOwner} scale="cell" align="right" />
          ) : (
            <Avatar name={lead.owner} size={24} />
          )}
        </View>
      </View>
    </CardRow>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  main: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  sub: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-2'],
    rowGap: theme.spacing['sp-1'],
  },
  next: { flexDirection: 'row' },
  end: { flexShrink: 0, maxWidth: '40%', alignItems: 'flex-end', gap: theme.spacing['sp-2'] },
});
