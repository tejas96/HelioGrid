'use client';
import { useLeadImportScreen } from '@heliogrid/data/react';
import { catalogImportNotes, leadImportWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  IMPORT_FILE_ACCEPT,
  IMPORT_FILE_MAX_MB,
  LargeTitle,
  LeadImport,
  UnavailableNote,
} from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useSpreadsheetFile } from '../../lib/use-spreadsheet-file';
import { LEAD_INBOX_PATH } from '../lead-inbox';
import { DOOR_PATH } from '../shell';
import { useImportAddress } from './hooks/use-import-address';

/**
 * The Lead Import Wizard on the web (`SCR-M02-05`): the owner at a desk bringing an old spreadsheet
 * in once, without making duplicates. What it draws is `useLeadImportScreen`'s, the phone's too;
 * the web's own parts are the file picker, the address that names the import and the router. A
 * person who may not import is told why, and never meets the wizard.
 */
export function LeadImportScreen({ job }: { job: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const words = useMemo(() => leadImportWords(t), [t]);
  const notes = useMemo(() => catalogImportNotes(t), [t]);
  const screen = useLeadImportScreen(job);
  const chooseFiles = useSpreadsheetFile(screen.choose);
  useImportAddress(screen.jobId, job);
  const file = screen.job;
  return (
    <div className="hg-shell-page">
      <LargeTitle
        title={words.title}
        summary={
          file === null || file.counts === null || !screen.allowed
            ? undefined
            : words.subtitle(file.fileName, file.counts.rows)
        }
      />
      {screen.allowed ? (
        <LeadImport
          {...screen}
          words={words}
          notice={notes.notice(screen.failure)}
          upload={{
            state: screen.upload.state,
            accept: IMPORT_FILE_ACCEPT,
            maxSizeMB: IMPORT_FILE_MAX_MB,
            message: notes.upload(screen.upload, IMPORT_FILE_MAX_MB),
            onRetry: screen.retry,
          }}
          onFiles={chooseFiles}
          onReplace={screen.onStartOver}
          onLeave={() => router.push(DOOR_PATH.leads)}
          onOpenInbox={() => router.push(LEAD_INBOX_PATH)}
        />
      ) : (
        <UnavailableNote
          variant="region"
          title={words.notAllowed.title}
          message={words.notAllowed.message}
        />
      )}
    </div>
  );
}
