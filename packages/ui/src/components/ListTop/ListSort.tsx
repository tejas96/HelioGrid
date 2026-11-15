import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Menu } from '../Menu';
import { chosenSortOf } from './ListTop.logic';
import type { ListSortProps } from './ListTop.types';

/**
 * The order of the list where the room is wide: a button that names the order opens the choices as
 * a menu. In the narrow room the order is the filter sheet's first choice (`filterWithSortOf`).
 */
export function ListSort({ sort }: { sort: ListSortProps }) {
  const chosen = chosenSortOf(sort);
  return (
    <Menu
      label={sort.title}
      selection="single"
      align="end"
      width={240}
      onSelect={sort.onChoose}
      items={sort.choices.map((choice) => ({
        key: choice.key,
        label: choice.label,
        selected: choice.key === sort.chosen,
      }))}
      trigger={
        <Button
          variant="secondary"
          size="md"
          icon={<ShellGlyph name="sort" size="sm" />}
          iconRight={<ShellGlyph name="caret-down" size="sm" />}
          spokenName={sort.spokenName(chosen)}
        >
          {chosen}
        </Button>
      }
    />
  );
}
