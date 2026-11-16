import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { DESTINATION_GLYPH } from '../AppShell/ShellGlyph.logic';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { ListRow } from '../ListRow/ListRow.native';
import type { SettingsListProps, SettingsWorkList } from './SettingsList.types';

/** One row of a tile — the shared `ListRow` with its icon tile, its name over what it is for, a chevron. */
export function SettingsRow({
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
    <View>
      {first ? null : <View style={styles.rule} />}
      <ListRow
        icon={<ShellGlyph name={glyph} size="md" tone="accent" />}
        iconShape="tile"
        title={
          <Text variant="body" bold>
            {name}
          </Text>
        }
        subtitle={hint}
        trailing={<ShellGlyph name="chevron-right" size="md" />}
        onClick={onPress}
        style={styles.row}
      />
    </View>
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
          <SettingsRow
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
    borderRadius: theme.radius['r-lg'],
  },
  row: {
    minHeight: 64,
    paddingVertical: theme.spacing['sp-2'],
    paddingLeft: theme.spacing['sp-2'],
    paddingRight: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-lg'],
  },
  /* The hairline between two rows starts at the name, under the icon tile's column. */
  rule: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: theme.spacing['sp-2'] + 40 + theme.spacing['sp-3'],
    right: theme.spacing['sp-3'],
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
});

/** A group's tile, as the list's groups and its work lists draw it. */
export const tileStyle = [tileSurface, styles.tile];
