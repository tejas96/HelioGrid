import type { TranslatedText, WonBasisWire } from '@heliogrid/contracts';
import { customerShortNameOf, type DealSegment } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

const READER = {
  pagePill: /*i18n*/ { id: '{number} / {count} · {title}' },
  goToPage: /*i18n*/ { id: 'Page {number}, {title}' },
  thumbName: /*i18n*/ { id: '{number} · {title}' },
  pagesName: /*i18n*/ { id: 'Pages' },
  documentName: /*i18n*/ { id: 'The document' },
  newVersion: /*i18n*/ { id: 'New version' },
  pdf: /*i18n*/ { id: 'PDF' },
  share: /*i18n*/ { id: 'Share with {name}' },
  sharePlain: /*i18n*/ { id: 'Share' },
  opening: /*i18n*/ { id: 'Opening the document' },
  failedTitle: /*i18n*/ { id: 'The document did not open' },
  failedMessage: /*i18n*/ { id: 'The customer’s link still works. Try again.' },
  retry: /*i18n*/ { id: 'Try again' },
} as const;

/** `ProposalReader`'s words (`SCR-M06-17`); `customerName` is the document's, shortened here. */
export function proposalReaderWords(
  t: T,
  customerName: string | null,
  segment: DealSegment | null,
) {
  const name = customerShortNameOf(customerName, segment);
  return {
    pagePill: (number: number, count: number, title: TranslatedText) =>
      t(READER.pagePill, { number, count, title }),
    goToPage: (number: number, title: TranslatedText) => t(READER.goToPage, { number, title }),
    thumbName: (number: number, title: TranslatedText) => t(READER.thumbName, { number, title }),
    pagesName: t(READER.pagesName),
    documentName: t(READER.documentName),
    newVersion: t(READER.newVersion),
    pdf: t(READER.pdf),
    share: name === null ? t(READER.sharePlain) : t(READER.share, { name }),
    opening: t(READER.opening),
    failedTitle: t(READER.failedTitle),
    failedMessage: t(READER.failedMessage),
    retry: t(READER.retry),
  };
}

const WON = {
  acceptedTitle: /*i18n*/ { id: '{name} accepted version {version}' },
  acceptedTitlePlain: /*i18n*/ { id: 'The customer accepted version {version}' },
  acceptedLine: /*i18n*/ { id: '{when} · from the link named {label}' },
  newerTitle: /*i18n*/ { id: 'Version {accepted} accepted, version {newer} not answered' },
  newerLine: /*i18n*/ {
    id: 'The customer has not answered the newest version. Type the value you agreed on the call.',
  },
  noneTitle: /*i18n*/ { id: 'No accepted proposal' },
  noneLine: /*i18n*/ { id: 'You can still mark won. The project will say so.' },
  lockedLabel: /*i18n*/ { id: 'Final value' },
  lockedNote: /*i18n*/ { id: 'From the accepted proposal. You do not type it.' },
  planAccepted: /*i18n*/ { id: 'Payment plan for the project' },
  planDefault: /*i18n*/ { id: 'Payment plan · your company’s default' },
  share: /*i18n*/ { id: '{share}%' },
  callFirst: /*i18n*/ { id: 'Call {name} on {phone} first. A person confirms a win, not a tap.' },
  callFirstPlain: /*i18n*/ { id: 'Call the customer first. A person confirms a win, not a tap.' },
  sibling: /*i18n*/ { id: 'Another lead of this customer has proposal {number}.' },
  siblingDraft: /*i18n*/ { id: 'Another lead of this customer has a proposal draft.' },
} as const;

/** The acceptance the win stands on, or why there is none: who, when and through which link. */
function proofOf(
  t: T,
  when: (instant: string) => string,
  basis: WonBasisWire,
  name: string | null,
): { readonly title: TranslatedText; readonly line: TranslatedText } {
  const { acceptance } = basis;
  if (acceptance === null) return { title: t(WON.noneTitle), line: t(WON.noneLine) };
  if (basis.basis === 'accepted_version') {
    return {
      title:
        name === null
          ? t(WON.acceptedTitlePlain, { version: acceptance.version })
          : t(WON.acceptedTitle, { name, version: acceptance.version }),
      line: t(WON.acceptedLine, {
        when: when(acceptance.acceptedAt),
        label: acceptance.linkLabel,
      }),
    };
  }
  if (basis.basis === 'newer_version_unanswered') {
    return {
      title: t(WON.newerTitle, {
        accepted: acceptance.version,
        newer: basis.unansweredVersion ?? acceptance.version + 1,
      }),
      line: t(WON.newerLine),
    };
  }
  return { title: t(WON.noneTitle), line: t(WON.noneLine) };
}

/** Mark won's proposal basis in words (`M07-62`, `T-M06-025`), over the server's own answer. */
export function markWonBasisWords(
  t: T,
  formats: {
    /** `beside`: the other amounts of the same column, which share one form. */
    readonly money: (amount: string, beside?: readonly string[]) => string;
    readonly when: (instant: string) => string;
    /** A stage's name as the customer's document says it — "On signing". */
    readonly due: (stage: string) => string;
  },
  basis: WonBasisWire,
  facts: {
    readonly customerName: string | null;
    readonly segment: DealSegment | null;
    readonly phone: string | null;
  },
) {
  const locked = basis.basis === 'accepted_version' && basis.finalValue !== null;
  const planAmounts = basis.plan.flatMap((part) => (part.amount === null ? [] : [part.amount]));
  const name = customerShortNameOf(facts.customerName, facts.segment);
  const proof = proofOf(t, formats.when, basis, name);
  return {
    locked,
    proofTitle: proof.title,
    proofLine: proof.line,
    lockedLabel: t(WON.lockedLabel),
    lockedValue: basis.finalValue === null ? '' : formats.money(basis.finalValue),
    lockedNote: t(WON.lockedNote),
    planTitle: t(locked ? WON.planAccepted : WON.planDefault),
    plan: basis.plan.map((part) => ({
      // The wire's decimal ("10.00") read as a person says it: "10%", "12.5%".
      share: t(WON.share, { share: String(Number(part.percent)) }),
      name: shownAsSent(part.label),
      due: shownAsSent(formats.due(part.dueOnStage)),
      amount: part.amount === null ? null : formats.money(part.amount, planAmounts),
    })),
    callFirst:
      name === null || facts.phone === null
        ? t(WON.callFirstPlain)
        : t(WON.callFirst, { name, phone: facts.phone }),
    sibling:
      basis.siblingProposal === null
        ? null
        : basis.siblingProposal.number === null
          ? t(WON.siblingDraft)
          : t(WON.sibling, { number: basis.siblingProposal.number }),
  };
}
