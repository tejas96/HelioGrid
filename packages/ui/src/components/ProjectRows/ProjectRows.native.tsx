import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Button } from '../Button/Button.native';
import { CardRow, CardRows, useCardRowAsideRoom } from '../CardRows/CardRows.native';
import { HueTile } from '../HueTile/HueTile.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { KIND_TILE, rowActOf, rowOpenOf } from './ProjectRows.logic';
import type {
  ProjectRowGroupProps,
  ProjectRowItem,
  ProjectRowListProps,
  ProjectRowMoreProps,
  ProjectRowProps,
} from './ProjectRows.types';

/** One project in a card of rows on the phone; its act sits outside the open target. */
export function ProjectRow(props: ProjectRowProps) {
  const { first, kind, act, chevron, highlighted = false, targetRef } = props;
  return (
    <CardRow
      first={first}
      highlighted={highlighted}
      targetRef={targetRef}
      open={rowOpenOf(props)}
      aside={act === null ? null : <Button {...rowActOf(act)}>{act.label}</Button>}
    >
      <View style={styles.row}>
        {kind === null ? null : <HueTile glyph={kind.glyph} hue={kind.tint} {...KIND_TILE.row} />}
        <RowWords {...props} />
        <RowEnd {...props} />
        {chevron ? <ShellGlyph name="chevron-right" size="sm" tone="secondary" /> : null}
      </View>
    </CardRow>
  );
}

/** The name, the line and the mark — clear of the act that sits over the row's end. */
function RowWords({ name, line, mark, words }: ProjectRowProps) {
  const asideRoom = useCardRowAsideRoom();
  return (
    <View style={[styles.main, asideRoom === 0 ? undefined : { paddingEnd: asideRoom }]}>
      {name === null ? (
        <NamedGap gap={words.noName} scale="field" />
      ) : (
        <Text variant="body" bold>
          {name}
        </Text>
      )}
      {line === null ? null : (
        <Text variant="body-sm" color="secondary">
          {line}
        </Text>
      )}
      {mark === null ? null : (
        <View style={styles.mark}>
          <StatusMark tone={mark.tone} label={mark.label} />
        </View>
      )}
    </View>
  );
}

/** The days figure, and the manager's face with their name as its spoken label. */
function RowEnd({ days, manager, act }: ProjectRowProps) {
  if (act !== null || (days === null && manager === null)) return null;
  return (
    <View style={styles.end}>
      {days === null ? null : (
        <Text variant="mono" color="secondary">
          {days}
        </Text>
      )}
      {manager === null ? null : (
        <View accessible accessibilityRole="image" accessibilityLabel={manager}>
          <Avatar name={manager} size={28} />
        </View>
      )}
    </View>
  );
}

/** A group's head inside the card on the phone: its kind tile, its overline and its count. */
export function ProjectRowGroup({ first, kind, label, count }: ProjectRowGroupProps) {
  return (
    <View style={[styles.group, first ? undefined : styles.groupRule]}>
      <HueTile glyph={kind.glyph} hue={kind.tint} {...KIND_TILE.head} />
      <Text variant="overline" color="primary">
        {label}
      </Text>
      <Text variant="mono" color="secondary">
        {String(count)}
      </Text>
    </View>
  );
}

/** The card's last line on the phone: the held-back rows' way in. */
export function ProjectRowMore({ label, onPress, focusAfter }: ProjectRowMoreProps) {
  const leaving = useFocusAfter(focusAfter);
  return (
    <View style={styles.more}>
      <Button variant="ghost" size="sm" onClick={leaving(onPress)}>
        {label}
      </Button>
    </View>
  );
}

/** One card of rows on the phone: each group's head, then its projects, then *Show more*. */
export function ProjectRowList({ items }: ProjectRowListProps) {
  return <CardRows>{items.map(itemOf)}</CardRows>;
}

function itemOf(item: ProjectRowItem) {
  if (item.kind === 'group') return <ProjectRowGroup key={item.key} {...item.group} />;
  if (item.kind === 'more') return <ProjectRowMore key={item.key} {...item.more} />;
  return <ProjectRow key={item.key} {...item.row} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  main: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  mark: { flexDirection: 'row', marginTop: theme.spacing['sp-1'] },
  end: { flexShrink: 0, alignItems: 'flex-end', gap: theme.spacing['sp-1'] },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    paddingTop: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-1'],
  },
  groupRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors['line-soft'] },
  more: { alignItems: 'flex-start', paddingHorizontal: theme.spacing['sp-1'] },
});
