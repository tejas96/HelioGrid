import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import type { CatalogItemsProps, CatalogRow } from './CatalogItems.types';

type Acts = Pick<CatalogItemsProps, 'words' | 'onPrefer' | 'onHide' | 'onArchive' | 'onRestore'>;

/**
 * One row's acts. An archived row has one, *Restore*. Otherwise the star and the side act — hide
 * on a platform item, archive on an own SKU — as two 44px pressed toggles, each with its whole
 * spoken name: in the 1536 row, and at the end of the phone's card.
 */
export function CatalogRowActs({
  row,
  stacked,
  acts,
}: {
  row: CatalogRow;
  stacked: boolean;
  acts: Acts;
}) {
  const { words } = acts;
  /* A platform item the platform retired has no way back from here: only an own SKU restores. */
  if (row.archived) {
    if (row.source !== 'own_item') return null;
    return (
      <Button
        variant="secondary"
        size="sm"
        icon={<ShellGlyph name="undo" size="sm" />}
        onClick={() => acts.onRestore(row)}
      >
        {words.restore}
      </Button>
    );
  }
  return <RowActs row={row} stacked={stacked} acts={acts} />;
}

/** The two 44px pressed toggles: in the 1536 row, and at the phone card's end. */
function RowActs({ row, stacked, acts }: { row: CatalogRow; stacked: boolean; acts: Acts }) {
  const own = row.source === 'own_item';
  return (
    <span className="hg-cat-acts" data-stacked={stacked ? 'true' : undefined}>
      <IconButton
        label={row.labels.prefer}
        size={stacked ? 40 : 44}
        variant={row.preferred ? 'dark' : 'surface'}
        pressed={row.preferred}
        onClick={() => acts.onPrefer(row)}
      >
        <ShellGlyph
          name="star"
          size="sm"
          filled={row.preferred}
          tone={row.preferred ? 'inverse' : 'secondary'}
        />
      </IconButton>
      <IconButton
        label={row.labels.side}
        size={stacked ? 40 : 44}
        variant={!own && row.hidden ? 'dark' : 'surface'}
        pressed={own ? undefined : row.hidden}
        onClick={() => (own ? acts.onArchive(row) : acts.onHide(row))}
      >
        <ShellGlyph
          name={own ? 'archive' : 'eye-off'}
          size="sm"
          tone={!own && row.hidden ? 'inverse' : 'secondary'}
        />
      </IconButton>
    </span>
  );
}
