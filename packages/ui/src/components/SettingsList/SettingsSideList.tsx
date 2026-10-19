import { Pressable } from '../../primitives/Pressable/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { personRow, SETTINGS_ROW_GLYPH } from './SettingsList.logic';
import type { SettingsListProps } from './SettingsList.types';

type SideRow = SettingsListProps['groups'][number]['rows'][number];

/**
 * The `side` form: a named navigation column — the title as an overline, the person's own row
 * first under it, then each group's overline over its rows. The page in view is marked on
 * `--accent-subtle` and announced as the current page.
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
        className="hg-settings-side-row"
        accessibilityState={{ current: here }}
        onPress={() => onOpen(item.key)}
      >
        <ShellGlyph
          name={SETTINGS_ROW_GLYPH[item.key]}
          size="md"
          tone={here ? 'accent' : 'secondary'}
        />
        <Text variant="body-sm" bold={here} color={here ? 'accent' : 'primary'}>
          {item.name}
        </Text>
      </Pressable>
    );
  };
  return (
    <nav className="hg-settings-side" aria-label={title}>
      <span className="hg-settings-side-overline">
        <Text variant="overline" color="secondary">
          {title}
        </Text>
      </span>
      {groups.map((group) => {
        const own = personRow(group);
        if (own !== null) return row(own);
        return (
          <div key={group.key} className="hg-settings-side-group">
            <span className="hg-settings-side-overline">
              <Text variant="overline" color="secondary">
                {group.name}
              </Text>
            </span>
            {group.rows.map(row)}
          </div>
        );
      })}
    </nav>
  );
}
