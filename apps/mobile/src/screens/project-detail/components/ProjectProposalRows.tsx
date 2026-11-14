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
import { OneToast } from '../../shared/OneToast';
import { languageNameOf } from '../../shared/use-proposal-formats';
import { useProposalMoves } from '../../shared/use-proposal-moves';

/**
 * What a project says of its proposal on the phone (`T-M06-025`, `T-F5-002`), drawn by the shared
 * `ProjectProposalSection`: the phone's own parts are the navigator, the share sheet that holds
 * Copy, a language named by its own name and the toast.
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
  const moves = useProposalMoves();
  const rows = useProjectProposalRows(project, {
    toVersions: moves.toVersions,
    openChat: moves.openChat,
    copy: moves.copy,
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
          language: languageNameOf(written),
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
