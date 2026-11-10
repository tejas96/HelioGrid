import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The CRM notices (`F6-10`): a lead given to someone (`M02-31`), an enquiry on a lead someone owns
 * (`M02-11`) or an ask for it from a colleague who cannot see it (`M02-08`), and a lead left
 * unassigned for more than a day, told to the EPC Owner (`M02-50`). The api
 * renders each in the RECIPIENT's language when it emits and stores it as written (`F6-08`), so
 * these words are the record's, never re-translated on read.
 */
import type { MessageRef, Translator } from '../runtime';

/** A bulk assign tells each person once (`F6-12`); the centre groups single ones by the same words. */
export const LEADS_ASSIGNED_COUNT: MessageRef = /*i18n*/ {
  id: '{count, plural, one {# lead assigned to you} other {# leads assigned to you}}',
};

/** An import's enquiries tell each owner once for the batch (`F6-12`): the leads they landed on, counted. */
export const LEAD_ENQUIRIES_COUNT: MessageRef = /*i18n*/ {
  id: '{count, plural, one {# new enquiry on your leads} other {# new enquiries on your leads}}',
};

const LEAD_NOTICES = {
  assignedTitle: /*i18n*/ { id: 'Lead assigned to you: {name}' },
  assignedBody: /*i18n*/ { id: '{assigner} assigned it to you.' },
  assignedManyBody: /*i18n*/ { id: '{assigner} assigned them to you.' },
  enquiryTitle: /*i18n*/ { id: 'New enquiry on {name}’s lead' },
  enquiryBody: /*i18n*/ { id: '{asker} logged a new enquiry. The next call is yours.' },
  askedBody: /*i18n*/ { id: '{asker} asked for this lead.' },
  importedBody: /*i18n*/ {
    id: '{asker} imported them from a spreadsheet. The next calls are yours.',
  },
  unassignedTitle: /*i18n*/ { id: '{name} has waited a day with no owner' },
  unassignedBody: /*i18n*/ { id: 'Give this lead to someone so it gets its first call.' },
} satisfies Record<string, MessageRef>;

interface NoticeText {
  title: TranslatedText;
  body: TranslatedText;
}

/**
 * The new owner's notice. `name` is how the lead reads in a list — its name, or its number while it
 * has none (`M02-03`); more than one lead is one notice that counts them.
 */
export function leadAssignedNotice(
  translate: Translator['t'],
  assigned: { assigner: string } & ({ name: string } | { count: number }),
): NoticeText {
  if ('count' in assigned) {
    return {
      title: translate(LEADS_ASSIGNED_COUNT, { count: assigned.count }),
      body: translate(LEAD_NOTICES.assignedManyBody, { assigner: assigned.assigner }),
    };
  }
  return {
    title: translate(LEAD_NOTICES.assignedTitle, { name: assigned.name }),
    body: translate(LEAD_NOTICES.assignedBody, { assigner: assigned.assigner }),
  };
}

/**
 * The owner's notice of an enquiry on their lead: logged on it, or — when the colleague cannot see
 * the lead — an ask to be given it. `name` reads as the lead does in a list; an import's enquiries
 * on more than one of the owner's leads are one notice that counts them.
 */
export function leadEnquiryNotice(
  translate: Translator['t'],
  enquiry: { asker: string } & ({ name: string; asked: boolean } | { count: number }),
): NoticeText {
  if ('count' in enquiry) {
    return {
      title: translate(LEAD_ENQUIRIES_COUNT, { count: enquiry.count }),
      body: translate(LEAD_NOTICES.importedBody, { asker: enquiry.asker }),
    };
  }
  const body = enquiry.asked ? LEAD_NOTICES.askedBody : LEAD_NOTICES.enquiryBody;
  return {
    title: translate(LEAD_NOTICES.enquiryTitle, { name: enquiry.name }),
    body: translate(body, { asker: enquiry.asker }),
  };
}

/**
 * The EPC Owner's notice of a lead unassigned for more than a day (`M02-50`). `name` reads as the
 * lead does in a list; the lead itself stays as it is.
 */
export function leadUnassignedNotice(
  translate: Translator['t'],
  unassigned: { name: string },
): NoticeText {
  return {
    title: translate(LEAD_NOTICES.unassignedTitle, { name: unassigned.name }),
    body: translate(LEAD_NOTICES.unassignedBody),
  };
}
