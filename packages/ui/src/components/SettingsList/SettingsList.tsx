import { useEffect, useState } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar/Avatar';
import { Block } from '../Block/Block';
import { BrandBloom } from '../BrandBloom/BrandBloom';
import { personRow, SETTINGS_ROW_GLYPH, settingsColumns } from './SettingsList.logic';
import type { SettingsListPerson, SettingsListProps } from './SettingsList.types';

/** The person's avatar diameter in their tile: the phone's frame measures 56, the 1536 frame 72. */
const AVATAR = { narrow: 56, wide: 72 } as const;
/** The bloom in the tile's corner — atmosphere, clipped by the tile. */
const BLOOM = 260;
/** The shell's desktop width, the same value `SettingsList.css` breaks at. */
const WIDE_SHELL = '(min-width: 968px)';

/** Whether the page stands at the shell's desktop width — the one fact the avatar's size follows. */
function useWideShell(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(WIDE_SHELL);
    const follow = () => setWide(query.matches);
    follow();
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }, []);
  return wide;
}

function PersonTile({
  person,
  rowName,
  onPress,
}: {
  person: SettingsListPerson;
  rowName: string;
  onPress: () => void;
}) {
  const wide = useWideShell();
  return (
    <Pressable className="hg-settings-person" onPress={onPress}>
      <span aria-hidden="true" className="hg-settings-person-bloom">
        <BrandBloom size={BLOOM} />
      </span>
      <span className="hg-settings-person-ring">
        <Avatar name={person.name} src={person.picture} size={wide ? AVATAR.wide : AVATAR.narrow} />
      </span>
      <span className="hg-settings-person-words">
        <Text variant="h3" bold>
          {person.name}
        </Text>
        <span className="hg-settings-row-name">
          <Text variant="body" color="secondary">
            {rowName}
          </Text>
        </span>
      </span>
      <span className="hg-settings-person-chevron">
        <ShellGlyph name="chevron-right" size="md" tone="primary" />
      </span>
    </Pressable>
  );
}

/**
 * The settings list: the title as the page's heading; the person's tile; then each group an
 * overline heading on the page over one grey tile holding its rows — each row a `Pressable` (a
 * keyboard control with the 44 px floor; `ListRow` is a plain div) with its icon circle, its name
 * and a chevron. Functional density; the columns stand side by side at the shell's desktop width
 * and stack in page order below it (`SettingsList.css`).
 */
export function SettingsList({ title, person, groups, onOpen }: SettingsListProps) {
  return (
    <div className="hg-settings-list">
      <Text as="h1" variant="h3" bold>
        {title}
      </Text>
      <div className="hg-settings-columns">
        {settingsColumns(groups).map((column) => (
          <div key={column[0]?.key} className="hg-settings-column">
            {column.map((group) => {
              const own = personRow(group);
              if (own !== null) {
                return (
                  <PersonTile
                    key={group.key}
                    person={person}
                    rowName={own.name}
                    onPress={() => onOpen(own.key)}
                  />
                );
              }
              return (
                <Block key={group.key} overline={group.name} density="functional">
                  <div className="hg-settings-tile">
                    {group.rows.map((row) => (
                      <Pressable
                        key={row.key}
                        className="hg-settings-row"
                        onPress={() => onOpen(row.key)}
                      >
                        <span className="hg-settings-row-icon">
                          <ShellGlyph name={SETTINGS_ROW_GLYPH[row.key]} size="md" tone="accent" />
                        </span>
                        <span className="hg-settings-row-name">
                          <Text variant="body">{row.name}</Text>
                        </span>
                        <ShellGlyph name="chevron-right" size="md" />
                      </Pressable>
                    ))}
                  </div>
                </Block>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
