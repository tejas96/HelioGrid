import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The notices a customer's link raises (`F6-10`, `F5-49`, `F5-53`, `F5-54`, `M06-54`): the first
 * open of a shared proposal, an answer on it, a question, a call asked for. The api renders each in
 * the RECIPIENT's language when it emits and stores it as written (`F6-08`). What the customer
 * wrote is shown as sent, never translated (`F5-53`).
 */
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';

const LINK_NOTICES = {
  openedTitle: /*i18n*/ { id: '{name} opened proposal {number}' },
  openedBody: /*i18n*/ { id: 'A good moment to call. No message delivery is claimed.' },
  acceptedTitle: /*i18n*/ { id: '{name} accepted proposal {number}' },
  acceptedBody: /*i18n*/ {
    id: 'From the link named {label}. Call to confirm, then mark the deal won.',
  },
  acceptedByBody: /*i18n*/ {
    id: 'From the link named {label}, for {contact}. Call to confirm, then mark the deal won.',
  },
  declinedTitle: /*i18n*/ { id: '{name} declined proposal {number}' },
  declinedBody: /*i18n*/ { id: 'Call them, then mark the lead lost or share again.' },
  changeTitle: /*i18n*/ { id: '{name} asked for a change to proposal {number}' },
  questionTitle: /*i18n*/ { id: '{name} asked a question' },
  callTitle: /*i18n*/ { id: '{name} asked for a call' },
  callBody: /*i18n*/ { id: 'The call is on your tasks. They asked for it themselves.' },
} satisfies Record<string, MessageRef>;

interface NoticeText {
  title: TranslatedText;
  body: TranslatedText;
}

/** What happened on the link; `name` reads as the lead does in a list. */
export type CustomerLinkNoticeFacts = { readonly name: string } & (
  | { readonly kind: 'opened' | 'declined'; readonly number: string }
  | {
      readonly kind: 'accepted';
      readonly number: string;
      readonly label: string;
      readonly contact: string | null;
    }
  | { readonly kind: 'change'; readonly number: string; readonly words: string }
  | { readonly kind: 'question'; readonly text: string }
  | { readonly kind: 'call' }
);

/** One link notice's words, in the reader's language. */
export function customerLinkNotice(
  translate: Translator['t'],
  facts: CustomerLinkNoticeFacts,
): NoticeText {
  const { name } = facts;
  switch (facts.kind) {
    case 'opened':
      return {
        title: translate(LINK_NOTICES.openedTitle, { name, number: facts.number }),
        body: translate(LINK_NOTICES.openedBody),
      };
    case 'accepted':
      return {
        title: translate(LINK_NOTICES.acceptedTitle, { name, number: facts.number }),
        body:
          facts.contact === null
            ? translate(LINK_NOTICES.acceptedBody, { label: facts.label })
            : translate(LINK_NOTICES.acceptedByBody, {
                label: facts.label,
                contact: facts.contact,
              }),
      };
    case 'declined':
      return {
        title: translate(LINK_NOTICES.declinedTitle, { name, number: facts.number }),
        body: translate(LINK_NOTICES.declinedBody),
      };
    case 'change':
      return {
        title: translate(LINK_NOTICES.changeTitle, { name, number: facts.number }),
        body: shownAsSent(facts.words),
      };
    case 'question':
      return {
        title: translate(LINK_NOTICES.questionTitle, { name }),
        body: shownAsSent(facts.text),
      };
    case 'call':
      return {
        title: translate(LINK_NOTICES.callTitle, { name }),
        body: translate(LINK_NOTICES.callBody),
      };
  }
}
