import type { CustomerLink } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

const LINKS = {
  active: /*i18n*/ { id: 'Active' },
  off: /*i18n*/ { id: 'Off' },
  /** The first share's link and a *Someone else* link both name no contact: say only that. */
  nobody: /*i18n*/ { id: 'No contact named' },
  notOpened: /*i18n*/ { id: 'Not opened yet · made {when}' },
  opened: /*i18n*/ {
    id: '{count, plural, one {Opened # time} other {Opened # times}} · last {when}',
  },
  openedOn: /*i18n*/ {
    id: '{count, plural, one {Opened # time} other {Opened # times}} · last {when} · {device}',
  },
  turnedOff: /*i18n*/ { id: 'Turned off {when}' },
  copy: /*i18n*/ { id: 'Copy the link for {label}' },
  remint: /*i18n*/ { id: 'Make a new address for {label}. The old one keeps working.' },
  revoke: /*i18n*/ { id: 'Turn off the link for {label}' },
  hint: /*i18n*/ {
    id: 'The customer’s page shows none of this. A link that is off shows a calm page with your name and number.',
  },
  noneTitle: /*i18n*/ { id: 'No link yet' },
  noneLine: /*i18n*/ { id: 'The first link is made when you share the proposal.' },
  confirmTitle: /*i18n*/ { id: 'Turn off the link for {label}?' },
  confirmLine: /*i18n*/ {
    id: 'It stops at once and cannot be turned on again. You can make a new link.',
  },
  confirmYes: /*i18n*/ { id: 'Turn it off' },
  confirmNo: /*i18n*/ { id: 'Keep it' },
  close: /*i18n*/ { id: 'Close' },
  loading: /*i18n*/ { id: 'Loading the links' },
  failedTitle: /*i18n*/ { id: 'The links did not load' },
  failedMessage: /*i18n*/ { id: 'Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
  summary: /*i18n*/ { id: 'One link per person. You see who opened which.' },
  newLink: /*i18n*/ { id: 'New link' },
  copied: /*i18n*/ { id: 'Link for {label} copied' },
  reminted: /*i18n*/ { id: 'New address for {label} copied. The old one still works.' },
  revoked: /*i18n*/ { id: 'Link for {label} is off. It stopped at once.' },
  made: /*i18n*/ { id: 'Link for {label} made and copied' },
  notCopied: /*i18n*/ { id: 'Not copied. Copy it by hand.' },
} as const;

const DEVICE: Readonly<Record<string, MessageRef | undefined>> = {
  phone: /*i18n*/ { id: 'on a phone' },
  tablet: /*i18n*/ { id: 'on a tablet' },
  desktop: /*i18n*/ { id: 'on a computer' },
};

function lineOf(t: T, when: (instant: string) => string, link: CustomerLink) {
  if (link.revokedAt !== null) return t(LINKS.turnedOff, { when: when(link.revokedAt) });
  if (link.lastOpenedAt === null) return t(LINKS.notOpened, { when: when(link.mintedAt) });
  const device = link.lastDeviceClass === null ? undefined : DEVICE[link.lastDeviceClass];
  const facts = { count: link.opens, when: when(link.lastOpenedAt) };
  return device === undefined
    ? t(LINKS.opened, facts)
    : t(LINKS.openedOn, { ...facts, device: t(device) });
}

/** `ProposalLinks`' words (`SCR-M06-20`, `F5-30`), with how a moment reads on the tenant's clock. */
export function proposalLinksWords(t: T, formats: { readonly when: (instant: string) => string }) {
  const actWord = { copy: LINKS.copy, remint: LINKS.remint, revoke: LINKS.revoke };
  return {
    status: (link: CustomerLink) => t(link.status === 'active' ? LINKS.active : LINKS.off),
    who: (link: CustomerLink) =>
      link.contact === null ? t(LINKS.nobody) : shownAsSent(link.contact.name),
    line: (link: CustomerLink) => lineOf(t, formats.when, link),
    act: (act: 'copy' | 'remint' | 'revoke', label: string) => t(actWord[act], { label }),
    hint: t(LINKS.hint),
    noneTitle: t(LINKS.noneTitle),
    noneLine: t(LINKS.noneLine),
    confirmTitle: (label: string) => t(LINKS.confirmTitle, { label }),
    confirmLine: t(LINKS.confirmLine),
    confirmYes: t(LINKS.confirmYes),
    confirmNo: t(LINKS.confirmNo),
    close: t(LINKS.close),
    loading: t(LINKS.loading),
    failedTitle: t(LINKS.failedTitle),
    failedMessage: t(LINKS.failedMessage),
    retry: t(LINKS.retry),
  };
}

/** The links page's head and its toasts. */
export function proposalLinksPageWords(t: T) {
  return {
    summary: t(LINKS.summary),
    newLink: t(LINKS.newLink),
    copied: (label: string) => t(LINKS.copied, { label }),
    reminted: (label: string) => t(LINKS.reminted, { label }),
    revoked: (label: string) => t(LINKS.revoked, { label }),
    made: (label: string) => t(LINKS.made, { label }),
    /** What the last act left to say, by the act — or that the device refused the clipboard. */
    said: (fact: { readonly act: string; readonly label: string }) => {
      const { label } = fact;
      if (fact.act === 'not_copied') return t(LINKS.notCopied);
      if (fact.act === 'remint') return t(LINKS.reminted, { label });
      if (fact.act === 'revoke') return t(LINKS.revoked, { label });
      if (fact.act === 'mint') return t(LINKS.made, { label });
      return t(LINKS.copied, { label });
    },
  };
}

const NEW_LINK = {
  title: /*i18n*/ { id: 'New link' },
  who: /*i18n*/ { id: 'Who is it for?' },
  whoPlaceholder: /*i18n*/ { id: 'Pick a person' },
  nobody: /*i18n*/ { id: 'Someone else' },
  label: /*i18n*/ { id: 'Name of the link' },
  labelHelper: /*i18n*/ { id: 'Only you see it' },
  labelNeeded: /*i18n*/ { id: 'Give the link a name' },
  hint: /*i18n*/ { id: 'When this person accepts, the record says which link was used.' },
  make: /*i18n*/ { id: 'Make link and copy' },
} as const;

/** `NewLinkSheet`'s words (`F5-26`). */
export function newLinkWords(t: T) {
  return {
    title: t(NEW_LINK.title),
    close: t(LINKS.close),
    who: t(NEW_LINK.who),
    whoPlaceholder: t(NEW_LINK.whoPlaceholder),
    nobody: t(NEW_LINK.nobody),
    label: t(NEW_LINK.label),
    labelHelper: t(NEW_LINK.labelHelper),
    labelNeeded: t(NEW_LINK.labelNeeded),
    hint: t(NEW_LINK.hint),
    make: t(NEW_LINK.make),
  };
}
