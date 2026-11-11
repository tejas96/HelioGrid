/**
 * The lead's timeline in words (`M02-35`): each entry's line and its second line, chosen by its
 * kind and body. A kind a newer server has learned reads as a plain system entry, its code shown as
 * sent (`F3-05`), so a new kind never breaks an older reader.
 */
import type { KnownActivity, TranslatedText } from '@heliogrid/contracts';
import {
  type ActivityActor,
  DEAL_SEGMENTS,
  LANGUAGES,
  MESSAGE_TEMPLATE_KEYS,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import {
  CALL_OUTCOME_WORD,
  DEAL_SEGMENT_WORD,
  DISQUALIFY_REASON_WORD,
  LEAD_STAGE_WORD,
  LOST_REASON_WORD,
  QUALIFY_QUESTION_LABEL,
} from './crm-vocabulary';
import { leadTaskTitle, qualifyCardWords } from './lead-detail-parts';
import { leadSourceWord } from './lead-marks';
import { projectEntryWords } from './project-timeline';

type T = Translator['t'];

const ENTRY = {
  created: /*i18n*/ { id: 'Lead created · {source}' },
  note: /*i18n*/ { id: 'Note' },
  call: /*i18n*/ { id: 'Call · {outcome}' },
  enquiry: /*i18n*/ { id: 'New enquiry · {channel}' },
  askedBy: /*i18n*/ { id: 'Asked by {name}' },
  movedTo: /*i18n*/ { id: 'Moved to {stage}' },
  woken: /*i18n*/ { id: 'Woken up' },
  reopened: /*i18n*/ { id: 'Reopened' },
  snoozedTill: /*i18n*/ { id: 'Snoozed till {date}' },
  dormant: /*i18n*/ { id: 'Went dormant' },
  disqualified: /*i18n*/ { id: 'Disqualified · {reason}' },
  lost: /*i18n*/ { id: 'Lost · {reason}' },
  junk: /*i18n*/ { id: 'Binned as junk' },
  assignedTo: /*i18n*/ { id: 'Assigned to {name}' },
  hadOpen: /*i18n*/ { id: '{name} had {count} open' },
  hadOpenWhy: /*i18n*/ { id: '{name} had {count} open · {reason}' },
  fieldChanged: /*i18n*/ { id: '{field} changed' },
  fromTo: /*i18n*/ { id: '{from} → {to}' },
  notSet: /*i18n*/ { id: 'Not set' },
  on: /*i18n*/ { id: 'On' },
  off: /*i18n*/ { id: 'Off' },
  keptBeside: /*i18n*/ { id: 'Kept beside {name}' },
  anotherCustomer: /*i18n*/ { id: 'another customer' },
  cameFrom: /*i18n*/ { id: 'Came from {name}' },
  referral: /*i18n*/ { id: 'Referral' },
  messageCopied: /*i18n*/ { id: 'Message copied · {template}' },
  noDelivery: /*i18n*/ { id: 'Sent from a person’s own phone. No delivery is claimed.' },
  visitBooked: /*i18n*/ { id: 'Visit booked · {date}, {time}' },
  visitRescheduled: /*i18n*/ { id: 'Visit rescheduled · {date}, {time}' },
  visitWho: /*i18n*/ { id: '{surveyor} · {address}' },
  taskDone: /*i18n*/ { id: 'Task done · {task}' },
  merged: /*i18n*/ { id: 'Customers merged' },
  name: /*i18n*/ { id: 'Name' },
  city: /*i18n*/ { id: 'City' },
  segment: /*i18n*/ { id: 'Type' },
  language: /*i18n*/ { id: 'Language' },
  doNotCall: /*i18n*/ { id: 'Do not call' },
  followUp: /*i18n*/ { id: 'Follow-up' },
  visitConfirmation: /*i18n*/ { id: 'Visit confirmation' },
} as const;

/** A field's name in a `field_change` entry. */
const FIELD_NAME: Readonly<Record<string, MessageRef>> = {
  name: ENTRY.name,
  city: ENTRY.city,
  segment: ENTRY.segment,
  preferredLanguage: ENTRY.language,
  doNotCall: ENTRY.doNotCall,
  ...QUALIFY_QUESTION_LABEL,
};

/** How the caller writes a day, a time and an amount on the tenant's clock and in its currency. */
export interface LeadTimelineFormats {
  readonly day: (date: string) => string;
  readonly time: (hhmm: string) => string;
  readonly money: (amount: string) => string;
  readonly word: (kind: 'stage' | 'party' | 'reason' | 'row' | 'step', key: string) => string;
}

/** What every entry carries, whatever its kind. */
interface EntryFacts {
  readonly id: string;
  readonly kind: string;
  readonly appliedAt: string;
  readonly actor: { readonly kind: ActivityActor; readonly name: string | null };
}

/** An entry as the hook hands it: a kind this build knows, or one a newer server learned. */
export type LeadTimelineEntryFacts =
  | { readonly known: true; readonly activity: KnownActivity }
  | { readonly known: false; readonly activity: EntryFacts };

export interface LeadTimelineEntryWords {
  readonly summary: TranslatedText;
  readonly detail: TranslatedText | null;
}

function asSent(code: string): TranslatedText {
  const words = code.replace(/_/g, ' ');
  return shownAsSent(words.charAt(0).toUpperCase() + words.slice(1));
}

/** A stored value of a field, in words: a vocabulary key worded, an amount in the currency. */
function fieldValue(t: T, formats: LeadTimelineFormats, field: string, value: string | null) {
  if (value === null) return t(ENTRY.notSet);
  if (field === 'monthlyBill') return shownAsSent(formats.money(value));
  if (field === 'doNotCall') return t(value === 'true' ? ENTRY.on : ENTRY.off);
  const segment = DEAL_SEGMENTS.find((known) => known === value);
  if (field === 'segment' && segment !== undefined) return t(DEAL_SEGMENT_WORD[segment]);
  if (field === 'preferredLanguage') {
    const language = Object.entries(LANGUAGES).find(([code]) => code === value);
    return shownAsSent(language?.[1].endonym ?? value);
  }
  const choice = qualifyCardWords(t).choice;
  if (
    field === 'roofOwnership' ||
    field === 'roofType' ||
    field === 'shading' ||
    field === 'timeline' ||
    field === 'decisionMaker'
  ) {
    return choice(field, value);
  }
  return shownAsSent(value);
}

function templateWord(t: T, key: string): TranslatedText {
  if (key === 'follow_up_nudge') return t(ENTRY.followUp);
  if (key === 'visit_confirmation') return t(ENTRY.visitConfirmation);
  return asSent(MESSAGE_TEMPLATE_KEYS.find((known) => known === key) ?? key);
}

/** An applied edit (`F4-16`): which field, and its old and new values in words. */
function fieldChange(
  t: T,
  formats: LeadTimelineFormats,
  body: Extract<KnownActivity, { kind: 'field_change' }>['body'],
): LeadTimelineEntryWords {
  const name = FIELD_NAME[body.field];
  return {
    summary: t(ENTRY.fieldChanged, { field: name === undefined ? asSent(body.field) : t(name) }),
    detail: t(ENTRY.fromTo, {
      from: fieldValue(t, formats, body.field, body.from),
      to: fieldValue(t, formats, body.field, body.to),
    }),
  };
}

function stateChange(
  t: T,
  formats: LeadTimelineFormats,
  body: Extract<KnownActivity, { kind: 'state_change' }>['body'],
): TranslatedText {
  switch (body.to) {
    case null:
      return t(body.from === 'snoozed' ? ENTRY.woken : ENTRY.reopened);
    case 'snoozed':
      return t(ENTRY.snoozedTill, { date: body.wakeOn === null ? '' : formats.day(body.wakeOn) });
    case 'dormant':
      return t(ENTRY.dormant);
    case 'disqualified':
      return t(ENTRY.disqualified, {
        reason:
          body.disqualifyReason === null ? '' : t(DISQUALIFY_REASON_WORD[body.disqualifyReason]),
      });
    case 'lost':
      return t(ENTRY.lost, {
        reason: body.lostReason === null ? '' : t(LOST_REASON_WORD[body.lostReason]),
      });
    case 'junk':
      return t(ENTRY.junk);
  }
}

function knownEntry(t: T, formats: LeadTimelineFormats, entry: KnownActivity) {
  const line = (summary: TranslatedText, detail: TranslatedText | null = null) => ({
    summary,
    detail,
  });
  switch (entry.kind) {
    case 'lead_created':
      return line(
        t(ENTRY.created, { source: leadSourceWord(t, entry.body.source) }),
        entry.body.segment === null ? null : t(DEAL_SEGMENT_WORD[entry.body.segment]),
      );
    case 'note':
      return line(t(ENTRY.note), shownAsSent(entry.body.text));
    case 'call':
      return line(
        t(ENTRY.call, { outcome: t(CALL_OUTCOME_WORD[entry.body.outcome]) }),
        entry.body.note === null ? null : shownAsSent(entry.body.note),
      );
    case 'enquiry':
      return line(
        t(ENTRY.enquiry, { channel: leadSourceWord(t, entry.body.channel) }),
        entry.body.askedBy === null ? null : t(ENTRY.askedBy, { name: entry.body.askedBy.name }),
      );
    case 'stage_change':
      return line(t(ENTRY.movedTo, { stage: t(LEAD_STAGE_WORD[entry.body.to]) }));
    case 'state_change':
      return line(stateChange(t, formats, entry.body));
    case 'assignment': {
      const { to, openCount: count, reason } = entry.body;
      return line(
        t(ENTRY.assignedTo, { name: to.name }),
        reason === null
          ? t(ENTRY.hadOpen, { name: to.name, count })
          : t(ENTRY.hadOpenWhy, { name: to.name, count, reason }),
      );
    }
    case 'field_change':
      return fieldChange(t, formats, entry.body);
    case 'duplicate_kept':
      return line(
        t(ENTRY.keptBeside, { name: entry.body.otherName ?? t(ENTRY.anotherCustomer) }),
        shownAsSent(entry.body.reason),
      );
    case 'referral':
      return line(
        entry.body.referrerName === null
          ? t(ENTRY.referral)
          : t(ENTRY.cameFrom, { name: entry.body.referrerName }),
      );
    case 'message_copied':
      return line(
        t(ENTRY.messageCopied, { template: templateWord(t, entry.body.templateKey) }),
        t(ENTRY.noDelivery),
      );
    case 'visit_booked':
    case 'visit_rescheduled': {
      const { date, time, surveyor, address } = entry.body;
      const when = { date: formats.day(date), time: formats.time(time) };
      return line(
        t(entry.kind === 'visit_booked' ? ENTRY.visitBooked : ENTRY.visitRescheduled, when),
        t(ENTRY.visitWho, { surveyor: surveyor.name, address }),
      );
    }
    case 'task_done':
      return line(t(ENTRY.taskDone, { task: leadTaskTitle(t, entry.body) }));
    case 'customer_merged':
      return line(t(ENTRY.merged));
    case 'project_moved':
    case 'project_wait':
    case 'project_document':
    case 'project_step':
    case 'project_changed':
      return projectEntryWords(t, formats, entry);
  }
}

/** One entry's words; an unknown kind is a plain system entry with its code as sent. */
export function leadTimelineEntryWords(
  t: T,
  formats: LeadTimelineFormats,
  entry: LeadTimelineEntryFacts,
): LeadTimelineEntryWords {
  return entry.known
    ? knownEntry(t, formats, entry.activity)
    : { summary: asSent(entry.activity.kind), detail: null };
}
