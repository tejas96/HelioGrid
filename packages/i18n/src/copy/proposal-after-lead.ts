import type { LeadProposals, TranslatedText } from '@heliogrid/contracts';
import { customerShortNameOf, type DealSegment } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { proposalStandingWord } from './proposal-after-standing';

type T = Translator['t'];
type LeadProposal = LeadProposals['items'][number];

/** What the caller holds for the tenant: money, a size, and how long ago a moment was. */
export interface LeadProposalsFormats {
  readonly money: (amount: string) => string;
  readonly number: (value: number) => string;
  /** "2 min ago", "3 days ago" — the caller's relative clock. */
  readonly ago: (instant: string) => string;
}

const SECTION = {
  noneTitle: /*i18n*/ { id: 'No proposal yet' },
  noneLine: /*i18n*/ { id: 'Build one for {name} in about a minute.' },
  noneLinePlain: /*i18n*/ { id: 'Build one in about a minute.' },
  create: /*i18n*/ { id: 'Create proposal' },
  draftTitle: /*i18n*/ { id: 'Proposal draft' },
  ringValue: /*i18n*/ { id: '{complete}/{of}' },
  ringName: /*i18n*/ { id: '{complete} of {of} steps done' },
  continue: /*i18n*/ { id: 'Continue' },
  numbered: /*i18n*/ { id: '{number} · v{version}' },
  kw: /*i18n*/ { id: '{size} kW' },
  saved: /*i18n*/ { id: 'saved {when}' },
  twoTitle: /*i18n*/ { id: 'Two proposals for one customer' },
  twoLine: /*i18n*/ { id: 'Keep the one the customer should answer, and withdraw the other.' },
  withdraw: /*i18n*/ { id: 'Withdraw' },
  withdrawNamed: /*i18n*/ { id: 'Withdraw {number}' },
  withdrawDraft: /*i18n*/ { id: 'Withdraw the draft' },
  closedLost: /*i18n*/ { id: 'This lead is marked lost' },
  closedDisqualified: /*i18n*/ { id: 'This lead is disqualified' },
  closedJunk: /*i18n*/ { id: 'This lead is in junk' },
  closedLine: /*i18n*/ { id: 'Reopen the lead to make a proposal.' },
  reopenLead: /*i18n*/ { id: 'Reopen lead' },
  sibling: /*i18n*/ { id: 'Another lead of this customer has proposal {number}.' },
  siblingDraft: /*i18n*/ { id: 'Another lead of this customer has a proposal draft.' },
  openSibling: /*i18n*/ { id: 'Open it' },
} as const;

/** A proposal's facts on one line: its size, its price, then when it was saved or who made it. */
function lineOf(t: T, formats: LeadProposalsFormats, proposal: LeadProposal): TranslatedText {
  const draft = proposal.standing === 'draft';
  const parts = [
    proposal.capacityKw === null
      ? null
      : t(SECTION.kw, { size: formats.number(proposal.capacityKw) }),
    proposal.payable === null ? null : formats.money(proposal.payable),
    draft
      ? t(SECTION.saved, { when: formats.ago(proposal.updatedAt) })
      : (proposal.madeBy?.name ?? null),
  ];
  return shownAsSent(parts.filter((part): part is string => part !== null).join(' · '));
}

/** The lead's Proposals section in words (`T-M06-001`, `T-M06-031`). */
export function leadProposalsWords(
  t: T,
  formats: LeadProposalsFormats,
  facts: {
    /** The customer's name, where the lead holds one; the words shorten it. */
    readonly customerName: string | null;
    /** The deal's segment: a business is called by its whole name (`customerShortNameOf`). */
    readonly segment: DealSegment | null;
    readonly closedAs: 'lost' | 'disqualified' | 'junk' | null;
  },
) {
  const closed = {
    lost: SECTION.closedLost,
    disqualified: SECTION.closedDisqualified,
    junk: SECTION.closedJunk,
  };
  return {
    noneTitle: t(SECTION.noneTitle),
    noneLine:
      facts.customerName === null
        ? t(SECTION.noneLinePlain)
        : t(SECTION.noneLine, {
            name: customerShortNameOf(facts.customerName, facts.segment),
          }),
    create: t(SECTION.create),
    draftTitle: t(SECTION.draftTitle),
    ringValue: (complete: number, of: number): string => t(SECTION.ringValue, { complete, of }),
    ringName: (complete: number, of: number) => t(SECTION.ringName, { complete, of }),
    continue: t(SECTION.continue),
    numbered: (number: string, version: number | null) =>
      version === null ? shownAsSent(number) : t(SECTION.numbered, { number, version }),
    line: (proposal: LeadProposal) => lineOf(t, formats, proposal),
    standing: (standing: string) => proposalStandingWord(t, standing),
    twoTitle: t(SECTION.twoTitle),
    twoLine: t(SECTION.twoLine),
    withdraw: t(SECTION.withdraw),
    withdrawNamed: (number: string | null) =>
      number === null ? t(SECTION.withdrawDraft) : t(SECTION.withdrawNamed, { number }),
    closedTitle: t(closed[facts.closedAs ?? 'lost']),
    closedLine: t(SECTION.closedLine),
    reopenLead: t(SECTION.reopenLead),
    siblingLine: (number: string | null) =>
      number === null ? t(SECTION.siblingDraft) : t(SECTION.sibling, { number }),
    openSibling: t(SECTION.openSibling),
  };
}

const WITHDRAW = {
  title: /*i18n*/ { id: 'Withdraw {number}?' },
  titleDraft: /*i18n*/ { id: 'Withdraw this draft?' },
  close: /*i18n*/ { id: 'Close' },
  madeBy: /*i18n*/ { id: 'Made by' },
  madeByWho: /*i18n*/ { id: '{name} · {date}' },
  system: /*i18n*/ { id: 'System and price' },
  state: /*i18n*/ { id: 'State' },
  hint: /*i18n*/ {
    id: 'Its link will say that the proposal is no longer active, with a name and a number to call. {name} is told.',
  },
  hintPlain: /*i18n*/ {
    id: 'Its link will say that the proposal is no longer active, with a name and a number to call.',
  },
  confirm: /*i18n*/ { id: 'Withdraw it' },
  note: /*i18n*/ { id: 'Nothing is deleted. It stays in the lead’s history.' },
} as const;

/** The Withdraw sheet's words for one proposal (`M06-58`); `close` is the sheet's own. */
export function proposalWithdrawWords(
  t: T,
  formats: Pick<LeadProposalsFormats, 'money' | 'number'> & {
    /** A calendar day as the market prints it. */
    readonly day: (instant: string) => string;
  },
  proposal: LeadProposal,
) {
  const size =
    proposal.capacityKw === null
      ? null
      : t(SECTION.kw, { size: formats.number(proposal.capacityKw) });
  const price = proposal.payable === null ? null : formats.money(proposal.payable);
  /* The size is words in the UI face; the price is a figure in mono (`CLAUDE.md` §9). */
  const system =
    size === null
      ? price === null
        ? null
        : { value: price, mono: true }
      : price === null
        ? { value: size }
        : { value: size, figure: price };
  const maker = proposal.madeBy?.name ?? null;
  return {
    close: t(WITHDRAW.close),
    words: {
      title:
        proposal.number === null
          ? t(WITHDRAW.titleDraft)
          : t(WITHDRAW.title, { number: proposal.number }),
      summary: [
        ...(maker === null
          ? []
          : [
              {
                label: t(WITHDRAW.madeBy),
                value: t(WITHDRAW.madeByWho, { name: maker, date: formats.day(proposal.madeAt) }),
              },
            ]),
        ...(system === null ? [] : [{ label: t(WITHDRAW.system), ...system }]),
        { label: t(WITHDRAW.state), value: proposalStandingWord(t, proposal.standing) },
      ],
      hint: maker === null ? t(WITHDRAW.hintPlain) : t(WITHDRAW.hint, { name: maker }),
      confirm: t(WITHDRAW.confirm),
      note: t(WITHDRAW.note),
    },
  };
}
