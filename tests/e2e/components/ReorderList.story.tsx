import { IconButton, ReorderList, ShellGlyph } from '@heliogrid/ui';
import { useState } from 'react';

interface Row {
  id: string;
  title: string;
}

/**
 * An authored order at its foot placement, as `SCR-M01-19`'s timeline draws it: the caller's pencil
 * opens each row's foot line, and the order and the deletes really land, so the focus that follows a
 * move and the live region's sentence run as they do on the page.
 */
export function FootReorderStory({ names, actionLabel }: { names: string[]; actionLabel: string }) {
  const [rows, setRows] = useState<Row[]>(() =>
    names.map((title, i) => ({ id: `row-${i}`, title })),
  );
  return (
    <ReorderList
      items={rows}
      keyOf={(row) => row.id}
      labelOf={(row) => row.title}
      density="functional"
      controls="foot"
      minItems={1}
      onMove={(_key, from, to) =>
        setRows((current) => {
          const next = [...current];
          const [moved] = next.splice(from, 1);
          if (moved) {
            next.splice(to, 0, moved);
          }
          return next;
        })
      }
      onDelete={(key) => setRows((current) => current.filter((row) => row.id !== key))}
      actionOf={() => (
        <IconButton label={actionLabel} size={40} variant="ghost">
          <ShellGlyph name="pencil" size="sm" tone="secondary" />
        </IconButton>
      )}
    />
  );
}
