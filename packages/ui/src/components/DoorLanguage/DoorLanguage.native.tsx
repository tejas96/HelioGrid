import { UI_LANGUAGES } from '@heliogrid/domain';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Menu } from '../Menu/Menu.native';
import type { DoorLanguageProps } from './DoorLanguage.types';

/** The door's language control over the sky: a globe and the current language's own name, and the set behind it. */
export function DoorLanguage({ label, current, names, onChoose }: DoorLanguageProps) {
  return (
    <Menu
      align="end"
      selection="single"
      label={label}
      trigger={
        <Button variant="ghost" size="sm" icon={<ShellGlyph name="globe" size="sm" />}>
          {names[current]}
        </Button>
      }
      items={UI_LANGUAGES.map((code) => ({
        key: code,
        label: names[code],
        selected: code === current,
        onSelect: () => onChoose(code),
      }))}
    />
  );
}
