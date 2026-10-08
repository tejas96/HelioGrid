import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';
import { Menu } from '../Menu/Menu.native';
import type { HomeHeadProps } from './HomeHead.types';

/** The home's head — the date, the title that switches homes, whose home this is, and an action. */
export function HomeHead({
  dateLine,
  title,
  switchName,
  switchLabel,
  entries,
  presetLine,
  switcherWidth,
  titleAnchor,
  action,
}: HomeHeadProps) {
  return (
    <View style={styles.head}>
      <View style={styles.titles}>
        <Text variant="overline" color="secondary">
          {dateLine}
        </Text>
        <View ref={viewRef(titleAnchor)} collapsable={false} style={styles.titleAnchor}>
          <Menu
            label={switchLabel}
            align="start"
            selection="single"
            width={switcherWidth}
            trigger={<TitleTrigger title={title} name={switchName} />}
            items={entries.map((entry) => ({
              key: entry.key,
              label: entry.label,
              meta: entry.meta,
              selected: entry.selected,
              onSelect: entry.onSelect,
            }))}
          />
        </View>
        <Text variant="caption" color="secondary">
          {presetLine}
        </Text>
      </View>
      {action}
    </View>
  );
}

interface TitleTriggerProps {
  title: string;
  name: string;
  /** Set by `Menu` when it clones its trigger. */
  onClick?: () => void;
}

function TitleTrigger({ title, name, onClick }: TitleTriggerProps) {
  return (
    <Pressable accessibilityLabel={name} onPress={onClick}>
      <View style={styles.trigger}>
        <View style={styles.titleWords}>
          <Text variant="h3">{title}</Text>
        </View>
        <ShellGlyph name="chevron" size="md" tone="primary" />
      </View>
    </Pressable>
  );
}

/** A coach mark measures the View this ref holds; any other anchor has no meaning on the phone. */
function viewRef(anchor: CoachMarkAnchor | undefined): RefObject<View | null> | undefined {
  if (anchor === undefined || typeof anchor === 'string' || !('current' in anchor))
    return undefined;
  return anchor as RefObject<View | null>;
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-6'],
  },
  titles: {
    gap: theme.spacing['sp-1'],
    minWidth: 0,
    flexShrink: 1,
  },
  // What the switcher's mark points at: the title alone, not the row it sits in.
  // At the largest system text the title wraps inside the margin instead of running past it.
  titleAnchor: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: theme.spacing['sp-1'],
    minHeight: theme.spacing['sp-12'],
  },
  titleWords: {
    flexShrink: 1,
  },
});
