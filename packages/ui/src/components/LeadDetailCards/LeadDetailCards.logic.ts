import { mapRead } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import { leadContactRowsOf } from '../LeadContactsCard/LeadContactsCard.logic';
import type { LeadContactsCardProps } from '../LeadContactsCard/LeadContactsCard.types';
import { leadTaskRowsOf } from '../LeadSections/LeadSections.logic';
import type { LeadFilesPanel, LeadSectionsProps } from '../LeadSections/LeadSections.types';
import type { LeadDetailCardsProps } from './LeadDetailCards.types';

/** The contacts card from the lead's screen: who to reach, the primary, and the calling facts. */
export function leadContactsCardOf<Failure>(
  { screen, view, onDial, first, words }: LeadDetailCardsProps<Failure>,
  format: MarketFormat,
): LeadContactsCardProps {
  const { acts, contacts } = screen;
  return {
    contacts: leadContactRowsOf(view.contacts, {
      role: words.role,
      phone: (phoneE164) => format.phone(phoneE164),
    }),
    onAdd: () => acts.open({ kind: 'contact', contactId: null }),
    onEdit: (contactId) => acts.open({ kind: 'contact', contactId }),
    onMakePrimary: contacts.setPrimary,
    primaryPending: contacts.primaryPending,
    onDial,
    doNotCall: {
      value: contacts.doNotCall,
      onChange: () => contacts.toggleDoNotCall(),
      pending: contacts.callingPending,
    },
    language: {
      value: contacts.language,
      onChange: contacts.setLanguage,
      pending: contacts.callingPending,
      options: words.languages,
    },
    failure: contacts.cardFailure === null ? null : words.failure(contacts.cardFailure),
    /* One column is the narrow page: contacts lead there, folded to the primary person. */
    foldable: first === 'contacts',
    words: words.contacts,
  };
}

/** The six sections from the lead's screen: the timeline, the booked visit, the tasks and files. */
export function leadSectionsOf<Failure>(
  props: LeadDetailCardsProps<Failure>,
  format: MarketFormat,
): LeadSectionsProps {
  const { screen, view, visit, timeline, words } = props;
  const { acts, tasks } = screen;
  return {
    section: screen.section,
    onSection: screen.setSection,
    counts: view.counts,
    timeline,
    siteAddress: view.siteAddress,
    visit:
      visit === null
        ? null
        : {
            line: words.visitLine({
              day: format.date(visit.date),
              time: format.time(visit.time),
              surveyor: visit.surveyor.name,
            }),
            onReschedule: () => acts.open({ kind: 'visit' }),
            onConfirmation: () => acts.open({ kind: 'message', template: 'visit_confirmation' }),
          },
    tasks: leadTaskRowsOf(view.tasks, {
      title: words.taskTitle,
      due: (dueAtEpoch) => {
        const due = new Date(dueAtEpoch);
        return words.taskDue({ day: format.date(due), time: format.clockAt(due.toISOString()) });
      },
    }),
    taskActs: {
      onDone: tasks.done,
      onReopen: tasks.reopen,
      onAddCallBack: () => acts.open({ kind: 'callBack' }),
      pendingId: tasks.pendingId,
      failure:
        tasks.failure === null
          ? null
          : { taskId: tasks.failure.taskId, reason: words.failure(tasks.failure.failure) },
    },
    files: leadFilesPanelOf(props, format),
    words: words.sections,
  };
}

/** The Files section: each file with who added it and when, the add, and the pick's own line. */
function leadFilesPanelOf<Failure>(
  { screen, onAddFile, onOpenFile, words }: LeadDetailCardsProps<Failure>,
  format: MarketFormat,
): LeadFilesPanel {
  const { files } = screen;
  const going = files.uploading || files.uploadFailed;
  return {
    read: mapRead(files.read, (listed) =>
      listed.map((file) => ({
        id: file.id,
        fileId: file.fileId,
        name: file.name,
        line: words.fileLine({ name: file.addedBy.name, day: format.date(file.addedAt) }),
      })),
    ),
    onAdd: files.canAdd ? onAddFile : null,
    pending:
      going && files.picked !== null ? { name: files.picked, failed: files.uploadFailed } : null,
    onRetry: files.retryUpload,
    onOpen: onOpenFile,
  };
}
