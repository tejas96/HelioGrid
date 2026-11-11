import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { CardRow } from '../CardRows/CardRows.native';
import { LeadSourceMark } from '../LeadSourceMark/LeadSourceMark.native';
import { leadNextToneOf } from './LeadListRow.logic';
import type { LeadListRowProps, LeadNextMarkProps } from './LeadListRow.types';

/** What comes next on a lead, as glyph, word and tint. */
export function LeadNextMark(props: LeadNextMarkProps) {
  return <StatusMark tone={leadNextToneOf(props)} label={props.label} />;
}

/** One lead of the list on the phone, its own card: the whole card opens it. */
export function LeadListRow({ lead, sourceLabel, next, first, onOpen, words }: LeadListRowProps) {
  return (
    <CardRow first={first} open={{ name: words.open(lead.name), onOpen }}>
      <View style={styles.row}>
        {lead.name === null ? (
          <View style={styles.noName}>
            <ShellGlyph name="phone" size="sm" tone="secondary" />
          </View>
        ) : (
          <Avatar name={lead.name} size={44} />
        )}
        <View style={styles.main}>
          {lead.name === null ? (
            <Text variant="mono" bold>
              {lead.phone}
            </Text>
          ) : (
            <Text variant="body" bold twoLines>
              {lead.name}
            </Text>
          )}
          <View style={styles.sub}>
            <LeadSourceMark source={lead.source} label={sourceLabel} form="glyph" />
            <StatusMark tone="accent" bare label={words.stage(lead.stage)} />
            {lead.city === null ? null : (
              <Text variant="body-sm" color="secondary">
                {lead.city}
              </Text>
            )}
          </View>
        </View>
        {lead.bill === null && next === null && lead.owner === null ? null : (
          <View style={styles.end}>
            {lead.bill === null ? null : <Text variant="mono">{lead.bill}</Text>}
            {next === null ? null : <LeadNextMark {...next} />}
            {lead.owner === null ? null : (
              <View accessible accessibilityRole="image" accessibilityLabel={lead.owner}>
                <Avatar name={lead.owner} size={24} />
              </View>
            )}
          </View>
        )}
      </View>
    </CardRow>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  /* A lead with no name yet: a dashed ring around the phone, where a face would be. */
  noName: {
    width: theme.layout['touch-min'],
    height: theme.layout['touch-min'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors['line-strong'],
  },
  main: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  sub: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-3'],
    rowGap: theme.spacing['sp-1'],
  },
  end: { flexShrink: 0, maxWidth: '45%', alignItems: 'flex-end', gap: theme.spacing['sp-2'] },
});
