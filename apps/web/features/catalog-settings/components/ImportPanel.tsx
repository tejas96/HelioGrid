'use client';
import { useCatalogImportPanel } from '@heliogrid/data/react';
import { catalogImportNotes, catalogImportWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogImport, IMPORT_FILE_ACCEPT, IMPORT_FILE_MAX_MB } from '@heliogrid/ui';
import { useMemo } from 'react';
import { useSpreadsheetFile } from '../hooks/use-spreadsheet-file';

/**
 * The import wizard opened from Catalog settings on the web (`SCR-M01-17`): what it draws is
 * `useCatalogImportPanel`'s, the phone's too; the catalog's words name it, `CatalogImport` draws
 * it. The web's own part is the file picker. Mounted only while open, so each opening starts on
 * the file step with nothing held from the last.
 */
export function ImportPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const words = useMemo(() => catalogImportWords(t), [t]);
  const notes = useMemo(() => catalogImportNotes(t), [t]);
  const panel = useCatalogImportPanel();
  const { wizard, fixes } = panel;
  const chooseFiles = useSpreadsheetFile(wizard.choose);

  return (
    <CatalogImport
      open
      onClose={onClose}
      words={words}
      frame={wizard.frame}
      job={wizard.job}
      opening={wizard.jobRead?.kind === 'loading'}
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
      kept={panel.kept}
      onOpenKept={wizard.reopen}
      onPlace={wizard.placeColumn}
      lists={panel.lists}
      scope={panel.scope}
      onScope={panel.toggleScope}
      query={panel.query}
      onQuery={panel.search}
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
      notice={notes.notice(panel.failure)}
    />
  );
}
