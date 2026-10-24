import { StyleSheet } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { TileAction, TileActions } from '../TileActions/TileActions.native';
import type { CatalogItemsProps, CatalogRow } from './CatalogItems.types';

type Acts = Pick<CatalogItemsProps, 'words' | 'onPrefer' | 'onHide' | 'onArchive' | 'onRestore'>;

/**
 * One card's acts on the phone: labelled pills — the star, then hide on a platform item or archive
 * on an own SKU — or *Restore* on an archived own SKU. A thumb is the only input, so the card form
 * is the only form (`stacked` is the web twin's).
 */
export function CatalogRowActs({ row, acts }: { row: CatalogRow; stacked: boolean; acts: Acts }) {
  const { words } = acts;
  /* A platform item the platform retired has no way back from here: only an own SKU restores. */
  if (row.archived && row.source !== 'own_item') return null;
  if (row.archived) {
    return (
      <Button
        variant="secondary"
        size="sm"
        icon={<ShellGlyph name="undo" size="sm" tone="primary" />}
        onClick={() => acts.onRestore(row)}
      >
        {words.restore}
      </Button>
    );
  }
  const ink = (on: boolean) => (on ? 'inverse' : 'primary');
  return (
    <TileActions rule={false} style={styles.acts}>
      <TileAction
        label={words.prefer}
        spokenLabel={row.labels.prefer}
        onLabel={words.preferred}
        on={row.preferred}
        icon={<ShellGlyph name="star" size="sm" filled={row.preferred} tone={ink(row.preferred)} />}
        onClick={() => acts.onPrefer(row)}
      />
      {row.source === 'platform_item' ? (
        <TileAction
          label={words.hide}
          spokenLabel={row.labels.side}
          onLabel={words.hidden}
          on={row.hidden}
          icon={<ShellGlyph name="eye-off" size="sm" tone={ink(row.hidden)} />}
          onClick={() => acts.onHide(row)}
        />
      ) : (
        <TileAction
          label={words.archive}
          spokenLabel={row.labels.side}
          icon={<ShellGlyph name="archive" size="sm" tone="primary" />}
          onClick={() => acts.onArchive(row)}
        />
      )}
    </TileActions>
  );
}

const styles = StyleSheet.create({
  acts: { width: '100%' },
});
