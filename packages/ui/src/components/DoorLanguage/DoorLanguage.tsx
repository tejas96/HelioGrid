import { UI_LANGUAGES } from '@heliogrid/domain';
import { Button } from '../Button/Button';
import { Menu } from '../Menu/Menu';
import type { DoorLanguageProps } from './DoorLanguage.types';

/** The ghost control in the door's header row: the current language's own name, and the set behind it. */
export function DoorLanguage({ label, current, names, onChoose }: DoorLanguageProps) {
  return (
    <Menu
      align="end"
      selection="single"
      label={label}
      trigger={
        <Button variant="ghost" size="sm">
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
