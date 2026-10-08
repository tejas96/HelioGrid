import { nextOpenGroup } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ActivityGlyph } from '../ActivityStream/ActivityGlyph.native';
import { groupGlyph } from './NotificationCard.logic';
import type { NotificationFilterBarProps } from './NotificationCard.types';

/**
 * The centre's filter bar on the phone: one row that scrolls sideways when several are on. A
 * button switched on darkens and its name slides out — one layout animation per change.
 */
export function NotificationFilterBar({
  label,
  unread,
  unreadOn,
  onUnread,
  groups,
  openGroup,
  onGroup,
}: NotificationFilterBarProps) {
  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="toolbar"
        accessibilityLabel={label}
        contentContainerStyle={styles.row}
      >
        <FilterButton
          label={unread.label}
          name={unread.name}
          on={unreadOn}
          onPress={() => slide(() => onUnread(!unreadOn))}
          icon={(ink) => <View style={[styles.dot, { backgroundColor: ink }]} />}
        />
        <View style={styles.rule} />
        {groups.map((group) => (
          <FilterButton
            key={group.value}
            label={group.label}
            name={group.label}
            on={openGroup === group.value}
            onPress={() => slide(() => onGroup(nextOpenGroup(openGroup, group.value)))}
            icon={(ink) => <ActivityGlyph name={groupGlyph(group.value)} size={18} color={ink} />}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/** The theme's emphasised slide: the next layout change — a name in or out — animates. */
function slide(change: () => void): void {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(theme.motion.durations.emphasised, 'easeInEaseOut', 'opacity'),
  );
  change();
}

interface FilterButtonProps {
  label: string;
  name: string;
  on: boolean;
  onPress: () => void;
  /** The mark, drawn in the button's ink: dark off, white on. */
  icon: (ink: string) => ReactNode;
}

/** On, a dark pill with its name; off, a 44 circle with its icon. */
function FilterButton({ label, name, on, onPress, icon }: FilterButtonProps) {
  const { controlFill } = useGround();
  const ink = on ? theme.colors['text-inverse'] : theme.colors['text-secondary'];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.button, on ? styles.buttonOn : { backgroundColor: controlFill }]}
    >
      <View style={styles.icon}>{icon(ink)}</View>
      {on ? (
        <Text variant="body-sm" bold color="inverse" style={styles.label}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/* The board's bar: 4 above, 12 below, buttons 4 apart; a 1 × 24 hairline 8 from either side; the
   18 icon centred by 13 a side in the 44 pill (off the spacing scale, as the board draws it). */
const styles = StyleSheet.create({
  bar: { paddingTop: theme.spacing['sp-1'], paddingBottom: theme.spacing['sp-3'] },
  row: { alignItems: 'center', gap: theme.spacing['sp-1'] },
  rule: {
    width: 1,
    height: theme.spacing['sp-6'],
    marginHorizontal: theme.spacing['sp-2'],
    backgroundColor: theme.colors['line-soft'],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    minWidth: 44,
    paddingLeft: 13,
    paddingRight: 13,
    borderRadius: theme.radius['r-pill'],
  },
  buttonOn: {
    paddingRight: theme.spacing['sp-4'],
    backgroundColor: theme.colors['action-primary'],
  },
  icon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: theme.radius['r-pill'] },
  label: { marginLeft: theme.spacing['sp-2'] },
});
