import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { IconButton } from '../IconButton/IconButton.native';
import type { CatalogItemsProps, CatalogRow } from './CatalogItems.types';

type Acts = Pick<CatalogItemsProps, 'words' | 'onPrefer' | 'onHide' | 'onArchive' | 'onRestore'>;

/**
 * One card's acts on the phone: two 44pt round toggles at the card's end — the star, then hide on a
 * platform item or archive on an own SKU — each with its whole spoken name, the on state drawn as
 * the ink disc; or *Restore* on an archived own SKU. `stacked` is the web twin's.
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
  const own = row.source === 'own_item';
  const ink = (on: boolean) => (on ? 'inverse' : 'secondary');
  return (
    <View style={styles.acts}>
      <IconButton
        label={row.labels.prefer}
        size={40}
        variant={row.preferred ? 'dark' : 'surface'}
        pressed={row.preferred}
        onClick={() => acts.onPrefer(row)}
      >
        <ShellGlyph name="star" size="sm" filled={row.preferred} tone={ink(row.preferred)} />
      </IconButton>
      <IconButton
        label={row.labels.side}
        size={40}
        variant={!own && row.hidden ? 'dark' : 'surface'}
        pressed={own ? undefined : row.hidden}
        onClick={() => (own ? acts.onArchive(row) : acts.onHide(row))}
      >
        <ShellGlyph name={own ? 'archive' : 'eye-off'} size="sm" tone={ink(!own && row.hidden)} />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  acts: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing['sp-2'],
  },
});
