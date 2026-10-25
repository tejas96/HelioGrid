import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { TileAction, TileActions } from '../TileActions';
import type { CatalogItemsProps, CatalogRow } from './CatalogItems.types';

type Acts = Pick<CatalogItemsProps, 'words' | 'onPrefer' | 'onHide' | 'onArchive' | 'onRestore'>;

/**
 * One row's acts. An archived row has one, *Restore*. Otherwise the star and the side act — hide
 * on a platform item, archive on an own SKU — as 44px pressed toggles in the 1536 row and as
 * labelled pills on the phone's card, where a thumb is the only input.
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
  return stacked ? <CardActs row={row} acts={acts} /> : <RowActs row={row} acts={acts} />;
}

/** The phone card's labelled pills. */
function CardActs({ row, acts }: { row: CatalogRow; acts: Acts }) {
  const { words } = acts;
  const own = row.source === 'own_item';
  return (
    <TileActions>
      <TileAction
        label={words.prefer}
        spokenLabel={row.labels.prefer}
        onLabel={words.preferred}
        on={row.preferred}
        icon={
          <ShellGlyph
            name="star"
            size="sm"
            filled={row.preferred}
            tone={row.preferred ? 'inverse' : 'secondary'}
          />
        }
        onClick={() => acts.onPrefer(row)}
      />
      {own ? (
        <TileAction
          label={words.archive}
          spokenLabel={row.labels.side}
          icon={<ShellGlyph name="archive" size="sm" />}
          onClick={() => acts.onArchive(row)}
        />
      ) : (
        <TileAction
          label={words.hide}
          spokenLabel={row.labels.side}
          onLabel={words.hidden}
          on={row.hidden}
          icon={<ShellGlyph name="eye-off" size="sm" tone={row.hidden ? 'inverse' : 'secondary'} />}
          onClick={() => acts.onHide(row)}
        />
      )}
    </TileActions>
  );
}

/** The 1536 row's two 44px pressed toggles. */
function RowActs({ row, acts }: { row: CatalogRow; acts: Acts }) {
  const own = row.source === 'own_item';
  return (
    <span className="hg-cat-acts">
      <IconButton
        label={row.labels.prefer}
        size={44}
        variant={row.preferred ? 'dark' : 'surface'}
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
        size={44}
        variant={!own && row.hidden ? 'dark' : 'surface'}
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
