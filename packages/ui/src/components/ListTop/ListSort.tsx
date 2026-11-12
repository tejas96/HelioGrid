import { useState } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Menu } from '../Menu';
import { Radio } from '../Radio/Radio';
import { Sheet } from '../Sheet';
import { chosenSortOf } from './ListTop.logic';
import type { ListRoom, ListSortProps } from './ListTop.types';

/**
 * The order of the list. Wide, a button that names the order opens the choices as a menu; narrow,
 * the sort glyph opens them as a sheet of radio rows, and a tap sorts and closes it.
 */
export function ListSort({ sort, room }: { sort: ListSortProps; room: ListRoom }) {
  const [open, setOpen] = useState(false);
  const chosen = chosenSortOf(sort);
  if (room === 'wide') {
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
  return (
    <>
      <IconButton label={sort.spokenName(chosen)} pressed={open} onClick={() => setOpen(true)}>
        <ShellGlyph name="sort" size="md" tone="primary" />
      </IconButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={sort.closeLabel}
        title={sort.title}
        size="auto"
      >
        <div className="hg-list-sort" role="radiogroup" aria-label={sort.title}>
          {sort.choices.map((choice) => (
            <Radio
              key={choice.key}
              name="list-sort"
              value={choice.key}
              label={choice.label}
              checked={choice.key === sort.chosen}
              onChange={() => {
                sort.onChoose(choice.key);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </Sheet>
    </>
  );
}
