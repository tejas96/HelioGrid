import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { personRow, SETTINGS_ROW_GLYPH } from './SettingsList.logic';
import type { SettingsListProps } from './SettingsList.types';

type SideRow = SettingsListProps['groups'][number]['rows'][number];

/**
 * The `side` form on the phone: the same column as the web's — the title as an overline, the
 * person's own row first, each group's overline over its rows, the page in view on
 * `accent-subtle` and announced as selected. The phone's own settings pages open from `More`
 * instead, so no phone screen draws it today; it keeps the one prop contract honest.
 */
export function SettingsSideList({
  title,
  groups,
  onOpen,
  current,
}: Pick<SettingsListProps, 'title' | 'groups' | 'onOpen' | 'current'>) {
  const row = (item: SideRow) => {
    const here = item.key === current;
    return (
      <Pressable
        key={item.key}
        accessibilityState={{ current: here }}
        onPress={() => onOpen(item.key)}
        style={[styles.row, here ? styles.here : undefined]}
      >
        <ShellGlyph
          name={SETTINGS_ROW_GLYPH[item.key]}
          size="md"
          tone={here ? 'accent' : 'secondary'}
        />
        <View style={styles.name}>
          <Text variant="body-sm" bold={here} color={here ? 'accent' : 'primary'}>
            {item.name}
          </Text>
        </View>
      </Pressable>
    );
  };
  return (
    <View style={styles.side}>
      <View style={styles.overline}>
        <Text variant="overline" color="secondary">
          {title}
        </Text>
      </View>
      {groups.map((group) => {
        const own = personRow(group);
        if (own !== null) return row(own);
        return (
          <View key={group.key} style={styles.group}>
            <View style={styles.overline}>
              <Text variant="overline" color="secondary">
                {group.name}
              </Text>
            </View>
            {group.rows.map(row)}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  side: { gap: theme.spacing['sp-1'], paddingTop: theme.spacing['sp-1'] },
  group: { gap: theme.spacing['sp-1'], marginTop: theme.spacing['sp-3'] },
  overline: { paddingHorizontal: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-2'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-sm'],
  },
  here: { backgroundColor: theme.colors['accent-subtle'] },
  name: { flex: 1, minWidth: 0 },
});
