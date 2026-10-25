import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { ListRow } from '../ListRow/ListRow';
import type { ImportFormats } from './CatalogImport.logic';
import type { CatalogImportWords, ImportKept } from './CatalogImport.types';
import './ImportFileStep.css';

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
    <section className="hg-import-kept" aria-label={words.keptReports}>
      <Text variant="body-sm" bold className="hg-import-kept-head">
        {words.keptReports}
      </Text>
      <div className="hg-import-kept-card">
        {kept.rows.map((report) => (
          <ListRow
            key={report.id}
            className="hg-import-kept-row"
            density="functional"
            icon={<ShellGlyph name="document" size="md" tone="secondary" />}
            title={report.fileName}
            subtitle={words.saved(formats.date(report.savedAt ?? report.createdAt))}
            trailing={<ShellGlyph name="chevron-right" size="md" tone="secondary" />}
            onClick={() => onOpen(report.id)}
          />
        ))}
      </div>
      {kept.hasMore ? (
        <Button variant="ghost" size="sm" onClick={kept.onMore}>
          {words.showMore}
        </Button>
      ) : null}
    </section>
  );
}
