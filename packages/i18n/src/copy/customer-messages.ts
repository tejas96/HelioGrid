import type { MessageTemplateKey } from '@heliogrid/domain';
/**
 * The platform's starter words for the two customer messages the CRM composes (`M02-33`,
 * `M02-47`, `M02-48`), authored by the task that first sends each key (`messaging/templates.ts`).
 * Like the document defaults (`document-defaults.ts`) they are catalog copy, read in the customer's
 * language; a company's own words, one plain text, arrive with the message templates editor
 * (SCR-M01-21), the first writer of a company's template, and then stand in front of these.
 *
 * Each comes back as a template with `<slot>` placeholders where its facts go, in the order the
 * language puts them, for domain's `composeMessage` to fill — or to leave out cleanly where a fact
 * is missing, so the customer never reads a raw placeholder (`M01-55`).
 */
import type { MessageRef, Translator } from '../runtime';

/** The keys the CRM composes; the rest are sent by the modules that own them. */
export type CrmMessageKey = Extract<MessageTemplateKey, 'visit_confirmation' | 'follow_up_nudge'>;

/** Every fact a CRM message may name, each a `<slot>` in the template. */
const MESSAGE_SLOTS = [
  'customer',
  'company',
  'date',
  'time',
  'surveyor',
  'surveyorPhone',
  'address',
  'sender',
  'senderPhone',
] as const;

/** What is happening, when, who is coming and their number (`M02-47`). */
const STARTER_WORDS = {
  visit_confirmation: /*i18n*/ {
    id: 'Hello {customer}, your solar site visit with {company} is booked for {date} at {time}. {surveyor} will come to {address}. You can reach them on {surveyorPhone}.',
  },
  follow_up_nudge: /*i18n*/ {
    id: 'Hello {customer}, this is {sender} from {company}, following up on your solar enquiry. When is a good time to talk? You can reach me on {senderPhone}.',
  },
} satisfies Record<CrmMessageKey, MessageRef>;

/** The key's starter words in the translator's language, its facts as `<slot>` placeholders. */
export function crmMessageTemplate(translate: Translator['t'], key: CrmMessageKey): string {
  const slots = Object.fromEntries(MESSAGE_SLOTS.map((slot) => [slot, `<${slot}>`]));
  return translate(STARTER_WORDS[key], slots);
}

/**
 * The proposal's customer messages (`M06-53`, `F5-48`, `F5-68`): the share a person sends with the
 * link, the thank-you after an Accept, and the evening-before crew message. Composed by the server
 * in the customer's language and SENT BY A PERSON — nothing here claims a delivery.
 */
export type ProposalMessageKey =
  | Extract<MessageTemplateKey, 'proposal_share' | 'acceptance_confirmation' | 'crew_arrival'>
  /** The thank-you for a version with no advance part: nothing is requested, a person calls. */
  | 'acceptance_confirmation_no_advance';

const PROPOSAL_MESSAGE_SLOTS = [
  'customer',
  'company',
  'capacity',
  'price',
  'link',
  'amount',
  'person',
  'sender',
  'senderPhone',
  'date',
  'time',
  'crew',
  'duration',
  'disturbance',
  'crewLead',
  'crewLeadPhone',
] as const;

const PROPOSAL_STARTER_WORDS = {
  proposal_share: /*i18n*/ {
    id: 'Hello {customer}, your {capacity} solar proposal from {company} is ready.\nPrice {price}. You can read it and answer here:\n{link}\n— {sender}, {senderPhone}',
  },
  /** `F5-48` — the advance is requested only once a person confirms; nothing is paid on Accept. */
  acceptance_confirmation: /*i18n*/ {
    id: 'Thank you {customer}. We have your acceptance for the {capacity} system at {price}.\nYour advance of {amount} is requested once {person} confirms on a call with you.\n— {sender}, {senderPhone}',
  },
  acceptance_confirmation_no_advance: /*i18n*/ {
    id: 'Thank you {customer}. We have your acceptance for the {capacity} system at {price}.\n{person} will call you to confirm the next steps.\n— {sender}, {senderPhone}',
  },
  /** `F5-68` — who is coming, when, how long, what to expect, and the crew lead's number. */
  crew_arrival: /*i18n*/ {
    id: 'Hello {customer}. Our crew comes on {date} at {time}.\n{crew}. The work takes {duration}.\n{disturbance}\nCrew lead: {crewLead}, {crewLeadPhone}.\n— {company}',
  },
} satisfies Record<ProposalMessageKey, MessageRef>;

/** The key's starter words in the translator's language, its facts as `<slot>` placeholders. */
export function proposalMessageTemplate(
  translate: Translator['t'],
  key: ProposalMessageKey,
): string {
  const slots = Object.fromEntries(PROPOSAL_MESSAGE_SLOTS.map((slot) => [slot, `<${slot}>`]));
  return translate(PROPOSAL_STARTER_WORDS[key], slots);
}

const MONEY_LINE_WORDS = {
  system: /*i18n*/ { id: 'System' },
  battery: /*i18n*/ { id: 'Battery' },
  discount: /*i18n*/ { id: 'Discount' },
} satisfies Record<string, MessageRef>;

/**
 * What each line of a proposal's payable equation is called (`M06-35`): the tax and the incentive
 * by the market's own names, never a word of ours (`F1-13`, `F1-14`).
 */
export function proposalMoneyLineWords(
  translate: Translator['t'],
  market: { readonly taxName: string; readonly incentiveName: string },
): { system: string; battery: string; discount: string; tax: string; incentive: string } {
  return {
    system: translate(MONEY_LINE_WORDS.system),
    battery: translate(MONEY_LINE_WORDS.battery),
    discount: translate(MONEY_LINE_WORDS.discount),
    tax: market.taxName,
    incentive: market.incentiveName,
  };
}

const INSTALL_DURATION = /*i18n*/ {
  id: '{days, plural, one {# day} other {# days}}',
} satisfies MessageRef;

/** How long the crew is on site, as the crew message says it (`F5-68`): `2 days`, `1.5 days`. */
export function installDurationWords(translate: Translator['t'], days: number): string {
  return translate(INSTALL_DURATION, { days });
}
