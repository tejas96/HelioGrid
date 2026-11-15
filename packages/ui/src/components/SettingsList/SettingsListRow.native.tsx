import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { DESTINATION_GLYPH } from '../AppShell/ShellGlyph.logic';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { SettingsListProps, SettingsWorkList } from './SettingsList.types';

/** One row of a tile: its icon chip, its name over what it is for, and a chevron. */
export function ListRow({
  first,
  glyph,
  name,
  hint,
  onPress,
}: {
  first: boolean;
  glyph: ShellGlyphName;
  name: string;
  hint: string | undefined;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {first ? null : <View style={styles.rule} />}
      <View style={styles.chip}>
        <ShellGlyph name={glyph} size="md" tone="accent" />
      </View>
      <View style={styles.name}>
        <Text variant="body" bold>
          {name}
        </Text>
        {hint === undefined ? null : (
          <Text variant="body-sm" color="secondary">
            {hint}
          </Text>
        )}
      </View>
      <ShellGlyph name="chevron-right" size="md" />
    </Pressable>
  );
}

/** The work lists the pill has no slot for: one tile of rows, each with its pill glyph. */
export function WorkLists({
  items,
  onOpen,
}: {
  items: readonly SettingsWorkList[];
  onOpen: NonNullable<SettingsListProps['workLists']>['onOpen'];
}) {
  return (
    <View style={tileStyle}>
      <GroundProvider ground="tile">
        {items.map((list, index) => (
          <ListRow
            key={list.key}
            first={index === 0}
            glyph={DESTINATION_GLYPH[list.key]}
            name={list.name}
            hint={undefined}
            onPress={() => onOpen(list.key)}
          />
        ))}
      </GroundProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  /* A group's tile: its rows inset by the record's 8, a hairline between them. */
  tile: {
    padding: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-tile'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    minHeight: 64,
    paddingVertical: theme.spacing['sp-2'],
    paddingLeft: theme.spacing['sp-2'],
    paddingRight: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-lg'],
  },
  /* The hairline between two rows starts at the name, under the icon chip's column. */
  rule: {
    position: 'absolute',
    top: 0,
    left: theme.spacing['sp-2'] + 40 + theme.spacing['sp-3'],
    right: theme.spacing['sp-3'],
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
  /* A row's icon chip: a soft accent pane — the row's mark, never a control. */
  chip: {
    width: 40,
    height: 40,
    borderRadius: theme.radius['r-sm'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors['accent-subtle'],
    ...theme.elevation.e1,
  },
  name: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});

/** A group's tile, as the list's groups and its work lists draw it. */
export const tileStyle = [tileSurface, styles.tile];
