import type { KnownActivity, TranslatedText } from '@heliogrid/contracts';
import { type FormatPack, formatMoneyPlainly } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

/**
 * A proposal's and its customer link's entries in the one stream their lead shows (`M06-45`,
 * `F5-31`, `M02-35`). A share is a person's tap and never a delivery (`M06-53`); what the customer
 * wrote is shown as sent, never translated (`F5-53`).
 */
type T = Translator['t'];

type ProposalKind =
  | 'proposal_generated'
  | 'proposal_shared'
  | 'proposal_withdrawn'
  | 'proposal_opened'
  | 'proposal_accepted'
  | 'proposal_negotiation_requested'
  | 'proposal_declined'
  | 'customer_question'
  | 'customer_call_requested'
  | 'customer_link_changed'
  | 'proposal_version_in_force';
type ProposalEntry = Extract<KnownActivity, { kind: ProposalKind }>;

interface ProposalEntryFormats {
  readonly day: (date: string) => string;
  /** The tenant's market format: an amount prints as the server wrote it, never rounded. */
  readonly pack: FormatPack;
}

interface Line {
  readonly summary: TranslatedText;
  readonly detail: TranslatedText | null;
}

const PROPOSAL_ENTRY = {
  generated: /*i18n*/ { id: 'Proposal {number} generated · version {version}' },
  shared: /*i18n*/ { id: 'Proposal {number} shared · version {version}' },
  sharedOnChat: /*i18n*/ { id: 'Shared from a person’s own chat. No delivery is claimed.' },
  linkCopied: /*i18n*/ { id: 'Link copied. No delivery is claimed.' },
  withdrawn: /*i18n*/ { id: 'Proposal {number} withdrawn' },
  withdrawnDraft: /*i18n*/ { id: 'Proposal draft withdrawn' },
  leadClosed: /*i18n*/ { id: 'The lead was closed' },
  opened: /*i18n*/ { id: 'Customer opened proposal {number}' },
  accepted: /*i18n*/ { id: 'Customer accepted proposal {number} · version {version}' },
  askedChange: /*i18n*/ { id: 'Customer asked for a change to proposal {number}' },
  declined: /*i18n*/ { id: 'Customer declined proposal {number}' },
  question: /*i18n*/ { id: 'Customer asked a question' },
  callRequested: /*i18n*/ { id: 'Customer asked for a call' },
  callDue: /*i18n*/ { id: 'Call due {date}' },
  linkMinted: /*i18n*/ { id: 'Link made · {label}' },
  linkReminted: /*i18n*/ { id: 'Link given a new address · {label}' },
  linkRelabelled: /*i18n*/ { id: 'Link renamed · {label}' },
  linkRevoked: /*i18n*/ { id: 'Link turned off · {label}' },
  inForce: /*i18n*/ { id: 'Version {version} of proposal {number} put in force' },
  fromLink: /*i18n*/ { id: 'From the link named {label}' },
  fromLinkOf: /*i18n*/ { id: 'From the link named {label} · {name}' },
};

const line = (summary: TranslatedText, detail: TranslatedText | null = null): Line => ({
  summary,
  detail,
});

/** Which named link carried a customer's act, and whose it is where a contact was named. */
function via(t: T, body: { linkLabel: string; contactName: string | null }): TranslatedText {
  return body.contactName === null
    ? t(PROPOSAL_ENTRY.fromLink, { label: body.linkLabel })
    : t(PROPOSAL_ENTRY.fromLinkOf, { label: body.linkLabel, name: body.contactName });
}

function linkChange(
  t: T,
  body: Extract<ProposalEntry, { kind: 'customer_link_changed' }>['body'],
): Line {
  const label = { label: body.label };
  switch (body.change) {
    case 'minted':
      return line(t(PROPOSAL_ENTRY.linkMinted, label));
    case 'reminted':
      return line(t(PROPOSAL_ENTRY.linkReminted, label));
    case 'relabelled':
      return line(t(PROPOSAL_ENTRY.linkRelabelled, label));
    case 'revoked':
      return line(t(PROPOSAL_ENTRY.linkRevoked, label));
    default:
      /* A change a newer server has learned reads as its code, as sent (`F3-05`). */
      return line(shownAsSent(body.change), shownAsSent(body.label));
  }
}

function withdrawn(
  t: T,
  body: Extract<ProposalEntry, { kind: 'proposal_withdrawn' }>['body'],
): Line {
  return line(
    body.number === null
      ? t(PROPOSAL_ENTRY.withdrawnDraft)
      : t(PROPOSAL_ENTRY.withdrawn, { number: body.number }),
    body.cause === 'lead_closed' ? t(PROPOSAL_ENTRY.leadClosed) : null,
  );
}

/** The customer's own reason where they gave one, as sent; else the link that carried the answer. */
function declineDetail(
  t: T,
  body: Extract<ProposalEntry, { kind: 'proposal_declined' }>['body'],
): TranslatedText {
  return body.reason === null ? via(t, body) : shownAsSent(body.reason);
}

/** A proposal or link entry's words, in the reader's language. */
export function proposalEntryWords(
  t: T,
  formats: ProposalEntryFormats,
  entry: ProposalEntry,
): Line {
  switch (entry.kind) {
    case 'proposal_generated': {
      const { number, version, payable } = entry.body;
      return line(
        t(PROPOSAL_ENTRY.generated, { number: number ?? '', version }),
        shownAsSent(formatMoneyPlainly(formats.pack, payable)),
      );
    }
    case 'proposal_shared': {
      const { number, version, channel } = entry.body;
      return line(
        t(PROPOSAL_ENTRY.shared, { number: number ?? '', version }),
        t(channel === 'copy_link' ? PROPOSAL_ENTRY.linkCopied : PROPOSAL_ENTRY.sharedOnChat),
      );
    }
    case 'proposal_withdrawn':
      return withdrawn(t, entry.body);
    case 'proposal_opened':
      return line(
        t(PROPOSAL_ENTRY.opened, { number: entry.body.number ?? '' }),
        via(t, entry.body),
      );
    case 'proposal_accepted': {
      const { number, version } = entry.body;
      return line(
        t(PROPOSAL_ENTRY.accepted, { number: number ?? '', version }),
        via(t, entry.body),
      );
    }
    case 'proposal_negotiation_requested':
      return line(
        t(PROPOSAL_ENTRY.askedChange, { number: entry.body.number ?? '' }),
        shownAsSent(entry.body.words),
      );
    case 'proposal_declined':
      return line(
        t(PROPOSAL_ENTRY.declined, { number: entry.body.number ?? '' }),
        declineDetail(t, entry.body),
      );
    case 'customer_question':
      return line(t(PROPOSAL_ENTRY.question), shownAsSent(entry.body.text));
    case 'customer_call_requested':
      return line(
        t(PROPOSAL_ENTRY.callRequested),
        t(PROPOSAL_ENTRY.callDue, { date: formats.day(entry.body.dueAt) }),
      );
    case 'customer_link_changed':
      return linkChange(t, entry.body);
    case 'proposal_version_in_force': {
      const { number, version } = entry.body;
      return line(t(PROPOSAL_ENTRY.inForce, { number: number ?? '', version }));
    }
  }
}
