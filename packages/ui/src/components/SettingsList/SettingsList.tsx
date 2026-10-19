import { Pressable } from '../../primitives/Pressable/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useDesktopShell } from '../AppShell/use-desktop-shell';
import { Avatar } from '../Avatar/Avatar';
import { Block } from '../Block/Block';
import { BrandBloom } from '../BrandBloom/BrandBloom';
import { personRow, SETTINGS_ROW_GLYPH } from './SettingsList.logic';
import type { SettingsListPerson, SettingsListProps } from './SettingsList.types';
import { SettingsSideList } from './SettingsSideList';

/** The person's avatar diameter in their tile: the phone's frame measures 56, the 1536 frame 72. */
const AVATAR = { narrow: 56, wide: 72 } as const;
/** The bloom in the tile's corner — atmosphere, clipped by the tile. */
const BLOOM = 260;
function PersonTile({
  person,
  rowName,
  onPress,
}: {
  person: SettingsListPerson;
  rowName: string;
  onPress: () => void;
}) {
  const wide = useDesktopShell() === true;
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
 * and a chevron. Functional density, one column in page order.
 */
export function SettingsList({
  title,
  person,
  groups,
  onOpen,
  form = 'page',
  current,
}: SettingsListProps) {
  if (form === 'side') {
    return <SettingsSideList title={title} groups={groups} onOpen={onOpen} current={current} />;
  }
  return (
    <div className="hg-settings-list">
      <Text as="h1" variant="h3" bold>
        {title}
      </Text>
      <div className="hg-settings-column">
        {groups.map((group) => {
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
    </div>
  );
}
