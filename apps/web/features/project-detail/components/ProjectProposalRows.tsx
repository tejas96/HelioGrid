'use client';
import type { ProjectDetail } from '@heliogrid/contracts';
import { useProjectProposalRows } from '@heliogrid/data/react';
import {
  messageSheetWords,
  projectProposalRowsWords,
  proposalScreenSaid,
  shareToastWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { type FocusAfter, ProjectProposalSection } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { copyText } from '../../../lib/copy-text';
import { OneToast } from '../../../lib/one-toast';
import { openExternal } from '../../../lib/open-external';
import { proposalVersionsPath } from '../../shell';

/**
 * What a project says of its proposal on the web (`T-M06-025`, `T-F5-002`), drawn by the shared
 * `ProjectProposalSection`: the web's own parts are the router, the chat opened in a tab, the
 * clipboard, a language named by `Intl` and the toast.
 */
export function ProjectProposalRows({
  project,
  onScheduleDay,
  focusAfter,
}: {
  project: ProjectDetail;
  /** The installation day's sheet, where the crew message's missing facts are added. */
  onScheduleDay: () => void;
  focusAfter: FocusAfter;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const rows = useProjectProposalRows(project, {
    toVersions: (proposalId) => router.push(proposalVersionsPath(proposalId)),
    // Only a message with a chat address reaches here: one with none is copied (`chatOrCopy`).
    openChat: (message) => {
      if (message.chatUri !== null) openExternal(message.chatUri);
    },
    copy: copyText,
  });
  const { crew } = rows;
  const written = crew.message.kind === 'ready' ? crew.message.value.language : locale;
  return (
    <>
      <ProjectProposalSection
        rows={rows}
        words={projectProposalRowsWords(t)}
        sheetWords={messageSheetWords(t, 'crew', {
          name: null,
          segment: null,
          language: new Intl.DisplayNames([locale], { type: 'language' }).of(written) ?? '',
        })}
        onScheduleDay={onScheduleDay}
      />
      <OneToast
        fact={crew.said === null ? null : { said: crew.said }}
        line={({ said }) =>
          said === 'copied'
            ? { tone: 'success', title: shareToastWords(t, '').messageCopied }
            : { tone: 'warning', title: proposalScreenSaid(t).notCopied }
        }
        onDismiss={crew.dismissSaid}
        focusAfter={focusAfter}
      />
    </>
  );
}
