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
