import type { TranslatedText } from '@heliogrid/contracts';
import { mapRead, type Read } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import { leadContactRowsOf } from '../LeadContactsCard/LeadContactsCard.logic';
import type { LeadContactsCardProps } from '../LeadContactsCard/LeadContactsCard.types';
import { leadTaskRowsOf } from '../LeadSections/LeadSections.logic';
import type {
  LeadDesign,
  LeadDesignsPanel,
  LeadDesignsWords,
  LeadFilesPanel,
  LeadSectionsProps,
} from '../LeadSections/LeadSections.types';
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
      locked: !view.acts.editable,
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
  const { screen, view, visit, timeline, words, proposals, designs } = props;
  const { acts, tasks } = screen;
  return {
    ...(proposals === undefined ? {} : { proposals }),
    designs,
    section: screen.section,
    onSection: screen.setSection,
    counts: view.counts,
    timeline,
    site: {
      address: view.site.address,
      confirmed: view.site.confirmed,
      facts: words.siteFacts(view.site),
    },
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
  const going = files.uploading || files.uploadFailed || files.refused !== null;
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
      going && files.picked !== null
        ? {
            name: files.picked,
            failed: files.uploadFailed || files.refused !== null,
            refused: files.refused,
          }
        : null,
    onRetry: files.retryUpload,
    onOpen: onOpenFile,
  };
}

/** What the Designs section reads and presses on the lead's screen; `useLeadDesignsSection` satisfies it. */
export interface LeadDesignsSectionState<Failure> {
  readonly read: Read<readonly LeadDesign[]>;
  readonly canDesign: boolean;
  readonly closed: boolean;
  create(): void;
  design(): void;
  copy(designId: string): void;
  open(designId: string): void;
  recommend(designId: string, recommended: boolean): void;
  readonly busy: boolean;
  readonly failure: Failure | null;
  readonly creating: boolean;
  readonly createFailure: Failure | null;
  readonly opening: boolean;
}

/**
 * The Designs section as `LeadSections` draws it (`T-M05-001`), from the screen's own hook — one
 * assembly for the web and the phone, so the two cannot read the section differently.
 */
export function leadDesignsPanelOf<Failure>(
  section: LeadDesignsSectionState<Failure>,
  words: LeadDesignsWords,
  failureWords: (failure: Failure) => TranslatedText,
): LeadDesignsPanel {
  return {
    read: section.read,
    canDesign: section.canDesign,
    closed: section.closed,
    words,
    onCreate: section.create,
    onDesign: section.design,
    onOpen: section.open,
    onCopy: section.copy,
    onRecommend: section.recommend,
    busy: section.busy,
    failure: section.failure === null ? null : failureWords(section.failure),
    creating: section.creating,
    createFailure: section.createFailure === null ? null : failureWords(section.createFailure),
    opening: section.opening,
  };
}
