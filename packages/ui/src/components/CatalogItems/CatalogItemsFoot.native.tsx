import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import type { CatalogItemsWords } from './CatalogItems.types';

/**
 * *Add an item* and *Import a file* close the phone's list, centred — the add raised, the import
 * quiet — where an owner concludes an item is missing (`SCR-M01-15`, `SCR-M01-16`). Each is absent
 * without the outright grant, never disabled.
 */
export function ListEntries({
  onAdd,
  onImport,
  words,
}: {
  onAdd: (() => void) | null;
  onImport: (() => void) | null;
  words: CatalogItemsWords;
}) {
  if (onAdd === null && onImport === null) return null;
  return (
    <View style={styles.entry}>
      {onAdd === null ? null : (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAdd}
          icon={<ShellGlyph name="plus" size="md" tone="primary" />}
        >
          {words.addItem}
        </Button>
      )}
      {onImport === null ? null : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onImport}
          icon={<ShellGlyph name="upload" size="md" tone="primary" />}
        >
          {words.importFile}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
  },
});
