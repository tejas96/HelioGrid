import { Pressable } from '../../primitives/Pressable/Pressable';
import { Text } from '../../primitives/Text/Text';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { DESTINATION_GLYPH } from '../AppShell/ShellGlyph.logic';
import type { SettingsListProps, SettingsWorkList } from './SettingsList.types';

/**
 * One row of a tile — a `Pressable` (a keyboard control with the 44 px floor; `ListRow` of the
 * record is a plain div) with its icon chip, its name over what it is for, and a chevron.
 */
export function ListRow({
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
    <Pressable className="hg-settings-row" onPress={onPress}>
      <span className="hg-settings-row-icon">
        <ShellGlyph name={glyph} size="md" tone="accent" />
      </span>
      <span className="hg-settings-row-words">
        <span className="hg-settings-row-name">
          <Text variant="body" bold>
            {name}
          </Text>
        </span>
        {hint === undefined ? null : (
          <Text variant="body-sm" color="secondary">
            {hint}
          </Text>
        )}
      </span>
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
    <div className="hg-settings-tile">
      {items.map((list) => (
        <ListRow
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
