import { Text } from '../../primitives/Text/Text';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { DESTINATION_GLYPH } from '../AppShell/ShellGlyph.logic';
import { ListRow } from '../ListRow';
import type { SettingsListProps, SettingsWorkList } from './SettingsList.types';

/** One row of a tile — the shared `ListRow` with its icon tile, its name over what it is for, a chevron. */
export function SettingsRow({
  glyph,
  name,
  hint,
  onPress,
}: {
  glyph: ShellGlyphName;
  name: string;
  hint: string | undefined;
  onPress: () => void;
}) {
  return (
    <ListRow
      className="hg-settings-row"
      icon={<ShellGlyph name={glyph} size="md" tone="accent" />}
      iconShape="tile"
      title={
        <span className="hg-settings-row-name">
          <Text variant="body" bold>
            {name}
          </Text>
        </span>
      }
      subtitle={hint}
      subtitleWrap
      trailing={<ShellGlyph name="chevron-right" size="md" />}
      onClick={onPress}
    />
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
    <div className="hg-settings-tile">
      {items.map((list) => (
        <SettingsRow
          key={list.key}
          glyph={DESTINATION_GLYPH[list.key]}
          name={list.name}
          hint={undefined}
          onPress={() => onOpen(list.key)}
        />
      ))}
    </div>
  );
}
