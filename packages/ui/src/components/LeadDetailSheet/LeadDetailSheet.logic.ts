import type { CrmMessageTemplateKey, DedupeMatchWire } from '@heliogrid/contracts';
import type {
  LeadActForm,
  LeadActSheetProps,
  LeadPhoneTaken,
} from '../LeadActSheet/LeadActSheet.types';
import type {
  LeadDetailSheetProps,
  LeadDetailSheetWords,
  LeadSheetOpen,
} from './LeadDetailSheet.types';

/** The sheet's props: the open act's form, its wait, and its failure — a message has none. */
export function leadActSheetOf(props: LeadDetailSheetProps): LeadActSheetProps {
  const { screen, words } = props;
  const { acts, contacts } = screen;
  const { sheet } = acts;
  const forContact = sheet?.kind === 'contact';
  const failure = forContact ? contacts.saveFailure : acts.sendFailure;
  return {
    form: sheet === null ? null : leadActFormOf(props, sheet),
    onClose: acts.close,
    pending: forContact ? contacts.saving : acts.sending,
    failure: failure === null || sheet?.kind === 'message' ? null : words.failure(failure),
    closeLabel: words.close,
    fields: words.fields,
  };
}

function leadActFormOf(props: LeadDetailSheetProps, sheet: LeadSheetOpen): LeadActForm {
  const { acts, days } = props.screen;
  const { forms } = props.words;
  switch (sheet.kind) {
    case 'log':
      return { kind: 'log', words: forms.log, onSend: (log) => acts.send({ kind: 'log', log }) };
    case 'visit':
      return visitFormOf(props);
    case 'snooze':
      return {
        kind: 'snooze',
        firstDay: days.tomorrow,
        words: forms.snooze,
        onSend: (wakeOn) => acts.send({ kind: 'snooze', wakeOn }),
      };
    case 'disqualify':
      return {
        kind: 'disqualify',
        words: forms.disqualify,
        onSend: (reason) => acts.send({ kind: 'disqualify', reason }),
      };
    case 'junk':
      return { kind: 'junk', words: forms.junk, onSend: () => acts.send({ kind: 'junk' }) };
    case 'callBack':
      return {
        kind: 'callBack',
        firstDay: days.today,
        words: forms.callBack,
        onSend: (due) => acts.send({ kind: 'callBack', ...due }),
      };
    case 'message':
      return messageFormOf(props, sheet.template);
    case 'contact':
      return contactFormOf(props, sheet.contactId);
    case 'details':
      return {
        kind: 'details',
        start: { name: props.lead.lead.name, city: props.lead.lead.city },
        words: forms.details,
        onSend: (changed) => acts.send({ kind: 'details', ...changed }),
      };
  }
}

/** A first booking, or the no-show reschedule of the visit booked, as domain's view decides. */
function visitFormOf({ screen, lead, view, words }: LeadDetailSheetProps): LeadActForm {
  const mode = view.acts.visit === 'reschedule' ? 'reschedule' : 'book';
  const { surveyors } = screen;
  return {
    kind: 'visit',
    mode,
    start:
      lead.visit === null
        ? {}
        : { surveyorId: lead.visit.surveyor.userId, address: lead.visit.address },
    firstDay: screen.days.today,
    surveyors: {
      read: surveyors,
      options:
        surveyors.kind === 'ready'
          ? surveyors.value.map((person) => ({ value: person.userId, label: person.name }))
          : [],
    },
    words: words.forms.visit(mode),
    onSend: screen.sendVisit,
  };
}

function messageFormOf(
  { screen, words, onHandOn }: LeadDetailSheetProps,
  template: CrmMessageTemplateKey,
): LeadActForm {
  const { message, templates, acts } = screen;
  const text = message.read.kind === 'ready' ? message.read.value : null;
  return {
    kind: 'message',
    read: message.read,
    text,
    templates: templates.map((key) => ({ key, label: words.forms.template[key] })),
    template,
    onTemplate: (key) => {
      const picked = templates.find((offered) => offered === key);
      if (picked !== undefined) acts.open({ kind: 'message', template: picked });
    },
    handedOn: message.handedOn,
    words: words.forms.message,
    onSend: () => {
      if (text !== null) onHandOn(text, message.markHandedOn);
    },
  };
}

function contactFormOf(
  { screen, lead, words, onMerge }: LeadDetailSheetProps,
  contactId: string | null,
): LeadActForm {
  const { contacts } = screen;
  const editing = lead.customer.contacts.find((contact) => contact.id === contactId) ?? null;
  const { labels } = contacts;
  const survivorId = lead.customer.id;
  return {
    kind: 'contact',
    start:
      editing === null
        ? null
        : {
            name: editing.name,
            phoneE164: editing.phoneE164,
            roleLabelId: editing.role?.id ?? null,
          },
    labels: {
      read: labels,
      options:
        labels.kind === 'ready'
          ? labels.value.map((label) => ({ value: label.id, label: words.role(label) ?? '' }))
          : [],
    },
    onAddLabel: contacts.addLabel,
    addingLabel: contacts.addingLabel,
    addedLabelId: contacts.addedLabelId,
    phoneTaken: phoneTakenOf(
      contacts.phoneTaken,
      words,
      screen.canMerge ? (otherId) => onMerge(survivorId, otherId) : null,
    ),
    words: words.forms.contact,
    onSend: screen.saveContact,
  };
}

/**
 * The record a contact's number already belongs to, with its three facts (`M02-02`) — Merge, with
 * that record as the other, only when it is in scope and the reader may merge.
 */
function phoneTakenOf(
  match: DedupeMatchWire | null,
  words: LeadDetailSheetWords,
  merge: ((otherId: string) => void) | null,
): LeadPhoneTaken | null {
  if (match === null) return null;
  const elapsed =
    match.lastContactAt === null ? null : Date.now() - Date.parse(match.lastContactAt);
  return {
    name: match.kind === 'visible' ? match.name : null,
    ownerName: match.ownerName,
    stage: match.stage,
    lastContact: words.lastContact(elapsed),
    onMerge: match.kind === 'visible' && merge !== null ? () => merge(match.customerId) : null,
  };
}
