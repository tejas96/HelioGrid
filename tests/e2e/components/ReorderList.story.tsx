import type { TranslatedText } from '@heliogrid/contracts';
import { createTranslator, reorderListWords } from '@heliogrid/i18n';
import { IconButton, ReorderList, ShellGlyph } from '@heliogrid/ui';
import { useState } from 'react';

const en = await createTranslator('en');
/* The sentences are functions the list calls while it renders, so they are bound here, in the
   browser, never handed across from the test. */
const words = reorderListWords(en.t);
const listName = en.t('Project phases');

/** A plain list of names, as the simplest caller holds one. */
export function PlainReorderStory({ names }: { names: string[] }) {
  return <ReorderList items={names} labelOf={(name) => name} label={listName} words={words} />;
}

interface Row {
  id: string;
  title: string;
}

/**
 * An authored order at its foot placement, as `SCR-M01-19`'s timeline draws it: the caller's pencil
 * opens each row's foot line, and the order and the deletes really land, so the focus that follows a
 * move and the live region's sentence run as they do on the page.
 */
export function FootReorderStory({
  names,
  actionLabel,
}: {
  names: string[];
  actionLabel: TranslatedText;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    names.map((title, i) => ({ id: `row-${i}`, title })),
  );
  return (
    <ReorderList
      items={rows}
      keyOf={(row) => row.id}
      labelOf={(row) => row.title}
      label={listName}
      words={words}
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
