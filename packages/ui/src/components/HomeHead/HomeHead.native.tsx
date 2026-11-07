import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';
import { Menu } from '../Menu/Menu.native';
import type { HomeHeadProps } from './HomeHead.types';

/** The home's head — the date, the greeting, the home's switcher and whose home it is, the verb. */
export function HomeHead({
  dateLine,
  greeting,
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
        <Text variant="display">{greeting}</Text>
        <View style={styles.switchRow}>
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
      </View>
      {action === undefined ? null : <View style={styles.action}>{action}</View>}
    </View>
  );
}

interface TitleTriggerProps {
  title: string;
  name: string;
  /** Set by `Menu` when it clones its trigger. */
  onClick?: () => void;
}

/** The home's title as a glass chip that opens the other homes. */
function TitleTrigger({ title, name, onClick }: TitleTriggerProps) {
  return (
    <Pressable accessibilityLabel={name} onPress={onClick}>
      <View style={styles.trigger}>
        <View style={styles.titleWords}>
          <Text variant="body-sm" bold>
            {title}
          </Text>
        </View>
        <ShellGlyph name="chevron" size="sm" tone="primary" />
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
    gap: theme.spacing['sp-5'],
  },
  titles: {
    gap: theme.spacing['sp-2'],
    minWidth: 0,
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
  },
  // The verb spans the column: the first thing a thumb reaches under the greeting.
  action: {
    alignSelf: 'stretch',
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
    gap: theme.spacing['sp-2'],
    minHeight: theme.layout['touch-min'],
    paddingStart: theme.spacing['sp-4'],
    paddingEnd: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    // biome-ignore lint/plugin/raw-white: glass — the chip is the card colour over the page glow (redesign direction A)
    backgroundColor: colors.surface,
    ...theme.elevation.e1,
  },
  titleWords: {
    flexShrink: 1,
  },
});
