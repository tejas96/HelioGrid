import type { TranslatedText } from '@heliogrid/contracts';
import { customerShortNameOf, type DealSegment } from '@heliogrid/domain';
import type { Translator } from '../runtime';

type T = Translator['t'];

/**
 * The words of a composed message's sheet (`M06-53`, `F5-48`, `F5-68`): the proposal's share, the
 * thank-you after an Accept and the evening-before crew message. Each says a person sends it; none
 * claims a delivery (`F5-28`).
 */
const MESSAGE = {
  shareTitle: /*i18n*/ { id: 'Share with {name}' },
  shareTitlePlain: /*i18n*/ { id: 'Share the proposal' },
  thankTitle: /*i18n*/ { id: 'Thank {name}' },
  thankTitlePlain: /*i18n*/ { id: 'Thank the customer' },
  linkToCome: /*i18n*/ { id: 'Their own link is added here when you share' },
  crewTitle: /*i18n*/ { id: 'The installation message' },
  close: /*i18n*/ { id: 'Close' },
  bubbleName: /*i18n*/ { id: 'The message' },
  note: /*i18n*/ { id: 'Written for you, in {language}. You can edit it in the chat.' },
  shareOnChat: /*i18n*/ { id: 'Share on WhatsApp' },
  sendWithout: /*i18n*/ { id: 'Send without it' },
  copyLink: /*i18n*/ { id: 'Copy link' },
  copyMessage: /*i18n*/ { id: 'Copy message' },
  getPdf: /*i18n*/ { id: 'Get PDF' },
  shareHint: /*i18n*/ {
    id: 'This opens WhatsApp. You pick the chat and send. A call to the customer is then put on your My Day for 2 days later.',
  },
  thankHint: /*i18n*/ {
    id: 'A courtesy, not the proof: the customer’s page already shows the acceptance. You pick the chat and send.',
  },
  crewHint: /*i18n*/ {
    id: 'You pick the chat and send. The customer’s page shows the same four facts.',
  },
  loading: /*i18n*/ { id: 'Writing the message' },
  failedTitle: /*i18n*/ { id: 'The message did not load' },
  failedMessage: /*i18n*/ { id: 'Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
  noTaxTitle: /*i18n*/ { id: 'Your first proposal has no {tax} number' },
  noTaxOwner: /*i18n*/ { id: 'Add it now and it prints on this and every proposal.' },
  noTaxOther: /*i18n*/ { id: '{name} can add it. You can still send.' },
  noTaxNobody: /*i18n*/ { id: 'The company’s owner can add it. You can still send.' },
  addIt: /*i18n*/ { id: 'Add it' },
  shared: /*i18n*/ { id: 'Marked as shared · follow-up on {date}' },
  copied: /*i18n*/ { id: 'Link copied · marked as shared · follow-up on {date}' },
  sharedPlain: /*i18n*/ { id: 'Marked as shared' },
  copiedPlain: /*i18n*/ { id: 'Link copied · marked as shared' },
  messageCopied: /*i18n*/ { id: 'Message copied' },
} as const;

/** Which sheet the words are for. */
export type MessageSheetKind = 'share' | 'thank' | 'crew';

export interface MessageSheetFacts {
  /** The customer's name, where the lead holds one; the words shorten it. */
  readonly name: string | null;
  /** The deal's segment: a business is called by its whole name (`customerShortNameOf`). */
  readonly segment: DealSegment | null;
  /** The language the message is written in, in its own name. */
  readonly language: string;
  /** The first send goes out with no tax number (`M01-24`): the main act then reads "Send without it". */
  readonly withoutTaxNumber?: boolean;
}

/** `MessageSheet`'s words for one of its three uses. */
export function messageSheetWords(t: T, kind: MessageSheetKind, facts: MessageSheetFacts) {
  const name = customerShortNameOf(facts.name, facts.segment);
  const title: Record<MessageSheetKind, TranslatedText> = {
    share: name === null ? t(MESSAGE.shareTitlePlain) : t(MESSAGE.shareTitle, { name }),
    thank: name === null ? t(MESSAGE.thankTitlePlain) : t(MESSAGE.thankTitle, { name }),
    crew: t(MESSAGE.crewTitle),
  };
  const hint = { share: MESSAGE.shareHint, thank: MESSAGE.thankHint, crew: MESSAGE.crewHint };
  return {
    title: title[kind],
    close: t(MESSAGE.close),
    bubbleName: t(MESSAGE.bubbleName),
    note: t(MESSAGE.note, { language: facts.language }),
    ...(kind === 'share' ? { linkToCome: t(MESSAGE.linkToCome) } : {}),
    share: t(facts.withoutTaxNumber === true ? MESSAGE.sendWithout : MESSAGE.shareOnChat),
    copy: t(kind === 'share' ? MESSAGE.copyLink : MESSAGE.copyMessage),
    ...(kind === 'share' ? { pdf: t(MESSAGE.getPdf) } : {}),
    hint: t(hint[kind]),
    loading: t(MESSAGE.loading),
    failedTitle: t(MESSAGE.failedTitle),
    failedMessage: t(MESSAGE.failedMessage),
    retry: t(MESSAGE.retry),
  };
}

/** The first-send notice (`M01-24`, `M01-29`): the market's tax name, and who can add the number. */
export function taxNumberNoticeWords(
  t: T,
  facts: { readonly taxName: string; readonly mayAdd: boolean; readonly ownerName: string | null },
) {
  const line = facts.mayAdd
    ? t(MESSAGE.noTaxOwner)
    : facts.ownerName === null
      ? t(MESSAGE.noTaxNobody)
      : t(MESSAGE.noTaxOther, { name: facts.ownerName });
  return { title: t(MESSAGE.noTaxTitle, { tax: facts.taxName }), line, add: t(MESSAGE.addIt) };
}

/**
 * What the toast says once the share act lands: marked shared, and when the follow-up falls — or,
 * where the share raised none (`followUpOn` null), only what happened.
 */
export function shareToastWords(t: T, followUpOn: string | null) {
  return {
    shared: followUpOn === null ? t(MESSAGE.sharedPlain) : t(MESSAGE.shared, { date: followUpOn }),
    copied: followUpOn === null ? t(MESSAGE.copiedPlain) : t(MESSAGE.copied, { date: followUpOn }),
    messageCopied: t(MESSAGE.messageCopied),
  };
}
