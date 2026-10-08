import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { styles as card, Glyph, Meta, Tile } from './NotificationCard.native';
import type { NotificationGroupProps, NotificationMemberProps } from './NotificationCard.types';

/**
 * Two or more of one type on one day (`F6-12`). The group card is not a link — grouping is
 * presentation only — and its members stack under it at full width, each its own record.
 */
export function NotificationGroup({
  type,
  sentence,
  latest,
  unreadLabel,
  open,
  onToggle,
  toggleLabel,
  members,
}: NotificationGroupProps) {
  return (
    <View style={styles.group}>
      <Tile name={sentence} style={card.card}>
        <View style={card.top} pointerEvents="box-none">
          <Glyph type={type} unread={unreadLabel !== undefined} />
          <View style={card.words}>
            <Text variant="body" bold style={card.title}>
              {sentence}
            </Text>
            <Meta time={latest} unreadLabel={unreadLabel} />
          </View>
        </View>
        <View style={card.foot}>
          <Button variant="secondary" size="sm" fullWidth expanded={open} onClick={onToggle}>
            {toggleLabel}
          </Button>
        </View>
      </Tile>
      {open ? (
        <View style={styles.members}>
          {members.map((member) => (
            <Member key={member.id} {...member} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Member({ title, line, unreadLabel, name, onOpen, sideAct }: NotificationMemberProps) {
  return (
    <Tile name={name} onOpen={onOpen} style={styles.member}>
      <View style={styles.memberWords} pointerEvents="none">
        <Text variant="body-sm" bold style={card.title}>
          {title}
        </Text>
        <View style={styles.memberLine}>
          <Text variant="caption" color="secondary">
            {line}
          </Text>
          {unreadLabel === undefined ? null : <Badge tone="accent">{unreadLabel}</Badge>}
        </View>
      </View>
      {sideAct ?? null}
    </Tile>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.spacing['sp-2'] },
  members: { gap: theme.spacing['sp-2'] },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: 44,
    paddingVertical: theme.spacing['sp-3'],
    paddingRight: theme.spacing['sp-3'],
    paddingLeft: theme.layout['tile-pad'],
    borderRadius: theme.radius['r-tile'],
  },
  memberWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  memberLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
