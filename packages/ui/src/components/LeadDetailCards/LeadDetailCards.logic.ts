import type { MarketFormat } from '../../utils/format';
import { leadContactRowsOf } from '../LeadContactsCard/LeadContactsCard.logic';
import type { LeadContactsCardProps } from '../LeadContactsCard/LeadContactsCard.types';
import { leadTaskRowsOf } from '../LeadSections/LeadSections.logic';
import type { LeadSectionsProps } from '../LeadSections/LeadSections.types';
import type { LeadDetailCardsProps } from './LeadDetailCards.types';

/** The contacts card from the lead's screen: who to reach, the primary, and the calling facts. */
export function leadContactsCardOf<Failure>(
  { screen, view, onDial, words }: LeadDetailCardsProps<Failure>,
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
    words: words.contacts,
  };
}

/** The six sections from the lead's screen: the timeline, the booked visit, and the open tasks. */
export function leadSectionsOf<Failure>(
  { screen, view, visit, timeline, words }: LeadDetailCardsProps<Failure>,
  format: MarketFormat,
): LeadSectionsProps {
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
    words: words.sections,
  };
}
