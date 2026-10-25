'use client';
import {
  useCatalogImport,
  useCatalogImportFixes,
  useCatalogImportLists,
  useCatalogImports,
} from '@heliogrid/data/react';
import { importListStep } from '@heliogrid/domain';
import { catalogImportNotes, catalogImportWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogImport, IMPORT_FILE_ACCEPT, IMPORT_FILE_MAX_MB } from '@heliogrid/ui';
import { useMemo, useState } from 'react';
import { useSpreadsheetFile } from '../hooks/use-spreadsheet-file';

/** A job that could not be read is said as an act that did not go through. */
const READ_FAILED = { conflict: false };

/** How many kept reports show before *Show more*. */
const KEPT_PAGE = 20;

/**
 * The import wizard opened from Catalog settings on the web (`SCR-M01-17`): the data hooks read and
 * write the import, the catalog's words name it, `CatalogImport` draws it. Mounted only while
 * open, so each opening starts on the file step with nothing held from the last.
 */
export function ImportPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const words = useMemo(() => catalogImportWords(t), [t]);
  const notes = useMemo(() => catalogImportNotes(t), [t]);
  const wizard = useCatalogImport('settings');
  const [scope, setScope] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const step = importListStep(wizard.frame, wizard.status);
  const fixes = useCatalogImportFixes(wizard.jobId, step, wizard.takeCounts);
  const lists = useCatalogImportLists(wizard.jobId, step, query);
  const kept = useCatalogImports(wizard.frame === 'empty', KEPT_PAGE);
  const chooseFiles = useSpreadsheetFile(wizard.choose);

  return (
    <CatalogImport
      open
      onClose={onClose}
      words={words}
      frame={wizard.frame}
      job={wizard.job}
      opening={wizard.opening}
      safeTop={0}
      upload={{
        state: wizard.upload.state,
        accept: IMPORT_FILE_ACCEPT,
        maxSizeMB: IMPORT_FILE_MAX_MB,
        message: notes.upload(wizard.upload, IMPORT_FILE_MAX_MB),
        onRetry: wizard.retry,
      }}
      onFiles={chooseFiles}
      onReplace={wizard.replace}
      mapping={wizard.draft}
      onSheet={wizard.chooseSheet}
      onHeaderRow={wizard.chooseHeaderRow}
      kept={{
        rows: kept.items,
        hasMore: kept.hasNextPage,
        onMore: () => void kept.fetchNextPage(),
      }}
      onOpenKept={wizard.reopen}
      onPlace={wizard.placeColumn}
      lists={lists}
      scope={scope}
      onScope={(group) => setScope((now) => (now === group ? null : group))}
      query={query}
      onQuery={setQuery}
      fixed={fixes.fixed}
      busy={fixes.busy}
      onFix={(card, target, body, undo) => void fixes.fix(card, target, body, undo)}
      onUndo={(row) => void fixes.undo(row)}
      gate={wizard.gate}
      onBack={wizard.back}
      onContinue={() => void wizard.proceed()}
      onRun={() => void wizard.run()}
      onStopWatching={onClose}
      onFixOpenRows={wizard.fixOpenRows}
      notice={notes.notice(
        wizard.failure ?? fixes.failure ?? (wizard.readFailed ? READ_FAILED : null),
      )}
    />
  );
}
