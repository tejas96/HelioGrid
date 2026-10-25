import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { ListRow } from '../ListRow/ListRow.native';
import type { ImportFormats } from './CatalogImport.logic';
import { CARD_RADIUS, raisedCard, rowDivider } from './CatalogImport.surfaces.native';
import type { CatalogImportWords, ImportKept } from './CatalogImport.types';

/**
 * *Kept reports* (m17-k): each kept import by its file name and the date it was saved, newest
 * first; a row opens that report. Nothing is drawn while there is none.
 */
export function ImportKeptReports({
  kept,
  words,
  formats,
  onOpen,
}: {
  kept: ImportKept;
  words: CatalogImportWords;
  formats: ImportFormats;
  onOpen: (id: string) => void;
}) {
  if (kept.rows.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="body-sm" bold style={styles.head}>
        {words.keptReports}
      </Text>
      <View style={styles.card}>
        {kept.rows.map((report, index) => (
          <ListRow
            key={report.id}
            style={index === 0 ? styles.row : [styles.row, rowDivider]}
            density="functional"
            icon={<ShellGlyph name="document" size="md" tone="secondary" />}
            title={report.fileName}
            subtitle={words.saved(formats.date(report.savedAt ?? report.createdAt))}
            trailing={<ShellGlyph name="chevron-right" size="md" tone="secondary" />}
            onClick={() => onOpen(report.id)}
          />
        ))}
      </View>
      {kept.hasMore ? (
        <View style={styles.more}>
          <Button variant="ghost" size="sm" onClick={kept.onMore}>
            {words.showMore}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

/* The board's section: 8 between the heading, the card and the more; rows 10 by 14. */
const styles = StyleSheet.create({
  section: { gap: theme.spacing['sp-2'] },
  head: { paddingHorizontal: theme.spacing['sp-1'] },
  card: { ...raisedCard, borderRadius: CARD_RADIUS },
  row: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 0 },
  more: { alignItems: 'center' },
});
