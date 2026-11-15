import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { CardRow } from '../CardRows/CardRows.native';
import { LeadSourceMark } from '../LeadSourceMark/LeadSourceMark.native';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { LEAD_STAGE_TONE } from '../StatusChip/StatusChip.registry';
import { LEAD_STAGE_GLYPH, leadNextToneOf, MARK_GLYPH_TONE } from './LeadListRow.logic';
import type { LeadListRowProps, LeadNextMarkProps } from './LeadListRow.types';

/** What comes next on a lead, as glyph, word and tint. */
export function LeadNextMark(props: LeadNextMarkProps) {
  return <StatusMark tone={leadNextToneOf(props)} label={props.label} />;
}

/** What comes next, as the card's last line: its own glyph and its words in the step's ink. */
function NextLine(props: LeadNextMarkProps) {
  const tone = leadNextToneOf(props);
  return (
    <StatusMark
      tone={tone}
      bare
      label={props.label}
      glyph={<ShellGlyph name={props.glyph} size="sm" tone={MARK_GLYPH_TONE[tone]} />}
      style={styles.next}
    />
  );
}

/** One lead of the list on the phone, its own card in three lines: the whole card opens it. */
export function LeadListRow({ lead, sourceLabel, next, first, onOpen, words }: LeadListRowProps) {
  const stage = { glyph: LEAD_STAGE_GLYPH[lead.stage], tone: LEAD_STAGE_TONE[lead.stage] };
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
          <View style={styles.top}>
            <View style={styles.name}>
              {lead.name === null ? (
                <Text variant="mono" bold>
                  {lead.phone}
                </Text>
              ) : (
                <Text variant="body-lg" bold twoLines>
                  {lead.name}
                </Text>
              )}
            </View>
            <StatusMark
              tone={stage.tone}
              label={words.stage(lead.stage)}
              glyph={<ShellGlyph name={stage.glyph} size="sm" tone={MARK_GLYPH_TONE[stage.tone]} />}
              style={styles.stage}
            />
          </View>
          <View style={styles.facts}>
            <LeadSourceMark
              source={lead.source}
              label={sourceLabel}
              form={lead.city === null && lead.bill === null ? 'word' : 'glyph'}
            />
            {lead.city === null ? null : (
              <Text variant="body-sm" color="secondary">
                {lead.city}
              </Text>
            )}
            {lead.bill === null ? null : (
              <View style={styles.bill}>
                <Text variant="mono">{lead.bill}</Text>
                <ProvenanceTier tier="assumed" />
              </View>
            )}
          </View>
          <View style={styles.foot}>
            <View style={styles.nextBox}>{next === null ? null : <NextLine {...next} />}</View>
            {lead.owner === null ? (
              <Text variant="caption" color="secondary">
                {words.noOwner}
              </Text>
            ) : (
              <View accessible accessibilityRole="image" accessibilityLabel={lead.owner}>
                <Avatar name={lead.owner} size={24} />
              </View>
            )}
          </View>
        </View>
      </View>
    </CardRow>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
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
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  /* A long name wraps to two lines beside the stage; the stage never shrinks. */
  name: { flex: 1, minWidth: 0 },
  stage: { flexShrink: 0 },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-3'],
    rowGap: theme.spacing['sp-0-5'],
  },
  bill: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
    minHeight: theme.spacing['sp-8'],
    marginTop: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-2'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  nextBox: { flex: 1, minWidth: 0 },
  next: { flexShrink: 1 },
});
