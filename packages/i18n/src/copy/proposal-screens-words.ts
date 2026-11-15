import type { TranslatedText } from '@heliogrid/contracts';
import {
  type CrewMessageFact,
  type FormatPack,
  formatClockAt,
  formatDayMonth,
  isTenantToday,
  PROPOSAL_ACT_REFUSALS,
  type ProposalActRefusal,
  type UiLanguage,
  VERSION_IN_FORCE_REFUSALS,
  type VersionInForceRefusal,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { attemptFailureMessageId } from './api-error';
import { assembled, shownAsSent } from './assembled';
import { lastContactWord } from './lead-marks';

/**
 * The proposal screens' own words (`SCR-M06-16`…`SCR-M06-20`): the page heads, what an act that
 * came back undone says where the person acted, and the lines a finished act leaves. The parts'
 * own words are theirs (`proposal-after-*.ts`); these are the screens' around them.
 */
type T = Translator['t'];

const HEAD = {
  trail: /*i18n*/ { id: 'Breadcrumb' },
  draft: /*i18n*/ { id: 'Proposal draft' },
  kw: /*i18n*/ { id: '{size} kW' },
  versions: /*i18n*/ { id: 'Versions' },
  links: /*i18n*/ { id: 'Links' },
  document: /*i18n*/ { id: 'Document' },
  documentDraft: /*i18n*/ { id: 'The draft as it stands' },
  more: /*i18n*/ { id: 'More' },
  withdraw: /*i18n*/ { id: 'Withdraw the proposal' },
  /* The phone's bar holds the way back as one round act: what it says to a screen reader. */
  /* The phone's document bar holds one line: the proposal and the version read. */
  documentNamed: /*i18n*/ { id: '{name} · v{version}' },
  backToProposals: /*i18n*/ { id: 'Back to proposals' },
  backToProposal: /*i18n*/ { id: 'Back to the proposal' },
} as const;

/** The parts of a page's one summary line, each a fact: joined in the reader's order. */
export function factsLine(facts: readonly (string | null)[]): TranslatedText {
  return assembled(facts.filter((fact) => fact !== null && fact !== '').join(' · '));
}

/** A proposal page's head: what the trail, the title and its one summary line say. */
export function proposalPageHeadWords(
  t: T,
  formats: {
    readonly money: (amount: string) => string;
    readonly number: (value: number) => string;
  },
) {
  return {
    trail: t(HEAD.trail),
    /** The proposal as a page names it: its number, or that it is a draft. */
    name: (number: string | null) => (number === null ? t(HEAD.draft) : shownAsSent(number)),
    /** "Anil Sharma · 3 kW · ₹1,90,575" — each part only where the proposal holds it. */
    summary: (facts: {
      readonly customerName: string | null;
      readonly capacityKw: number | null;
      readonly payable: string | null;
    }) =>
      factsLine([
        facts.customerName,
        facts.capacityKw === null ? null : t(HEAD.kw, { size: formats.number(facts.capacityKw) }),
        facts.payable === null ? null : formats.money(facts.payable),
      ]),
    versions: t(HEAD.versions),
    /** "PRP-0042 · Anil Sharma" — whose versions these are, under the page's title. */
    versionsSummary: (facts: {
      readonly number: string | null;
      readonly customerName: string | null;
    }) => factsLine([facts.number ?? t(HEAD.draft), facts.customerName]),
    links: t(HEAD.links),
    document: t(HEAD.document),
    /** "PRP-0042 · v2" — the document as the phone's bar names it; a draft never generated says so. */
    documentTitle: (number: string | null, version: number | null) =>
      number === null || version === null
        ? t(HEAD.documentDraft)
        : t(HEAD.documentNamed, { name: number, version }),
    more: t(HEAD.more),
    withdraw: t(HEAD.withdraw),
    backToProposals: t(HEAD.backToProposals),
    backToProposal: t(HEAD.backToProposal),
  };
}

/** A lead as the copy picker lists it: where it is and its number — facts, joined. */
export function pickLeadLine(facts: { readonly city: string | null; readonly phone: string }) {
  return factsLine([facts.city, facts.phone]);
}

const SAID = {
  inForce: /*i18n*/ { id: 'Version {version} is now in force on the project' },
  pdfLate: /*i18n*/ { id: 'The PDF is still being made. Try again in a moment.' },
  pdfFailed: /*i18n*/ { id: 'The PDF did not open. The customer’s link still works.' },
  notCopied: /*i18n*/ { id: 'Not copied. Copy it by hand.' },
  withdrawn: /*i18n*/ { id: 'Proposal withdrawn. Its link now says it is no longer active.' },
} as const;

/** The lines a finished act, or one the device refused, leaves on a proposal screen. */
export function proposalScreenSaid(t: T) {
  return {
    inForce: (version: number) => t(SAID.inForce, { version }),
    pdfLate: t(SAID.pdfLate),
    pdfFailed: t(SAID.pdfFailed),
    notCopied: t(SAID.notCopied),
    withdrawn: t(SAID.withdrawn),
  };
}

/** Why the proposal's own standing refused an act — a sentence, never a code. */
const REFUSAL: Record<ProposalActRefusal, MessageRef> = {
  not_generated: /*i18n*/ { id: 'Not done. Generate the proposal first.' },
  lead_closed: /*i18n*/ { id: 'Not done. The lead is closed. Reopen the lead to make a proposal.' },
  nothing_new_to_share: /*i18n*/ {
    id: 'Not shared. This proposal is no longer active. Generate a new version first.',
  },
  not_shared: /*i18n*/ {
    id: 'Not done. Share the proposal first: the first share makes its link.',
  },
  already_answered: /*i18n*/ { id: 'Not done. The customer already answered this version.' },
  version_not_current: /*i18n*/ { id: 'Not done. A newer version is on the customer’s link.' },
  deal_won: /*i18n*/ { id: 'Not done. The deal is already won.' },
  not_active: /*i18n*/ { id: 'Not done. This proposal was withdrawn or replaced already.' },
  already_generated: /*i18n*/ {
    id: 'Not discarded. This proposal has a version: withdraw it instead.',
  },
  figures_not_current: /*i18n*/ {
    id: 'Not shared. Its figures are no longer current. Generate it again, then share.',
  },
};

/** Why *Put version N in force* was refused after Won (`M08-50`) — the version's own standing. */
const IN_FORCE_REFUSAL: Record<VersionInForceRefusal, MessageRef> = {
  version_unknown: /*i18n*/ { id: 'Not done. That version is not on this proposal.' },
  version_already_in_force: /*i18n*/ {
    id: 'Not done. That version is already in force, or a newer one is.',
  },
};

const FAILED = {
  unknownRefusal: /*i18n*/ { id: 'Not done. The proposal does not allow it now.' },
  changedElsewhere: /*i18n*/ { id: 'Changed on another device — reload' },
  movedTo: /*i18n*/ { id: 'This lead moved to {name}' },
  moved: /*i18n*/ { id: 'This lead moved to someone else' },
  linkAlreadyOff: /*i18n*/ { id: 'This link is off already.' },
} as const;

/** An act's failure as `packages/data` hands it out, by shape. */
export type ProposalActFailureLike =
  | { readonly kind: 'refused'; readonly refusal: string }
  | { readonly kind: 'changed_elsewhere' }
  | { readonly kind: 'lead_moved'; readonly to: { readonly name: string } | null }
  | { readonly kind: 'billing' }
  | {
      readonly kind: 'failed';
      readonly failure: Parameters<typeof attemptFailureMessageId>[0]['failure'];
      readonly code: string | null;
      readonly message: string;
    };

/**
 * Why an act on a proposal came back undone, said where the person acted (`F8-36`). The billing
 * gate's refusal reads `null`: the app's one denial says it (`M12-21`), so no second line.
 */
export function proposalActFailureWords(
  t: T,
  failure: ProposalActFailureLike | null,
): TranslatedText | null {
  if (failure === null || failure.kind === 'billing') return null;
  if (failure.kind === 'changed_elsewhere') return t(FAILED.changedElsewhere);
  if (failure.kind === 'lead_moved') {
    return failure.to === null ? t(FAILED.moved) : t(FAILED.movedTo, { name: failure.to.name });
  }
  if (failure.kind === 'refused') {
    if (failure.refusal === 'already_revoked') return t(FAILED.linkAlreadyOff);
    const inForce = VERSION_IN_FORCE_REFUSALS.find((refusal) => refusal === failure.refusal);
    if (inForce !== undefined) return t(IN_FORCE_REFUSAL[inForce]);
    const known = PROPOSAL_ACT_REFUSALS.find((refusal) => refusal === failure.refusal);
    return t(known === undefined ? FAILED.unknownRefusal : REFUSAL[known]);
  }
  const id = attemptFailureMessageId({
    failure: failure.failure,
    ...(failure.code === null ? {} : { code: failure.code }),
  });
  return id === undefined ? shownAsSent(failure.message) : t({ id });
}

const MOMENT = {
  today: /*i18n*/ { id: 'Today, {time}' },
  onDay: /*i18n*/ { id: '{day}, {time}' },
} as const;

/**
 * How a proposal screen says a moment, on the company's clock: "Today, 18:02", else its day and
 * time; and how long ago one was — "4 days ago". One pair for the list, the track screen, the
 * versions and the links, so no two of them word a moment differently.
 */
export function proposalMoments(
  t: T,
  clock: { readonly pack: FormatPack; readonly language: UiLanguage; readonly now: number },
) {
  const { pack, language, now } = clock;
  return {
    when: (instant: string): string => {
      const time = formatClockAt(pack, instant);
      return isTenantToday(pack, instant, now)
        ? t(MOMENT.today, { time })
        : t(MOMENT.onDay, { day: formatDayMonth(pack, instant, language), time });
    },
    ago: (instant: string): string => lastContactWord(t, now - Date.parse(instant)),
  };
}

const PROJECT = {
  versionTitle: /*i18n*/ { id: 'Runs on version {version} of {number}' },
  versionLine: /*i18n*/ { id: 'The price and the payment plan the customer accepted' },
  newerLine: /*i18n*/ {
    id: 'Version {version} is newer and not in force. Open the versions to put it in force.',
  },
  noProposalTitle: /*i18n*/ { id: 'Won without an accepted proposal' },
  noProposalLine: /*i18n*/ {
    id: 'The value was typed and the plan is the company’s default terms.',
  },
  crewTitle: /*i18n*/ { id: 'The installation message is due' },
  crewLine: /*i18n*/ { id: 'Send the customer who is coming, when and for how long.' },
  crewNeedsTitle: /*i18n*/ { id: 'The installation message needs the day’s facts' },
  crewNeeds: /*i18n*/ { id: 'Add {facts} first, then send it.' },
  factStart: /*i18n*/ { id: 'the start time' },
  factDays: /*i18n*/ { id: 'the days on site' },
  factLead: /*i18n*/ { id: 'the crew lead' },
  factCrew: /*i18n*/ { id: 'the crew' },
} as const;

const LIST = {
  two: /*i18n*/ { id: '{first} and {second}' },
  three: /*i18n*/ { id: '{first}, {second} and {third}' },
  four: /*i18n*/ { id: '{first}, {second}, {third} and {fourth}' },
} as const;

/** The missing facts as one phrase in the reader's own way of listing — at most the four there are. */
function listOf(t: T, items: readonly TranslatedText[]): TranslatedText {
  const [first = '', second = '', third = '', fourth = ''] = items;
  if (items.length <= 1) return shownAsSent(first);
  if (items.length === 2) return t(LIST.two, { first, second });
  if (items.length === 3) return t(LIST.three, { first, second, third });
  return t(LIST.four, { first, second, third, fourth });
}

const CREW_FACT = {
  start_time: PROJECT.factStart,
  duration: PROJECT.factDays,
  crew_lead: PROJECT.factLead,
  crew: PROJECT.factCrew,
} as const satisfies Record<CrewMessageFact, MessageRef>;

/** What a project says of its proposal, and of the evening-before message (`M07-62`, `M08-50`, `F5-68`). */
export function projectProposalRowsWords(t: T) {
  return {
    version: (facts: { readonly number: string; readonly version: number }) => ({
      title: t(PROJECT.versionTitle, facts),
      line: t(PROJECT.versionLine),
    }),
    newer: (version: number) => t(PROJECT.newerLine, { version }),
    noProposal: { title: t(PROJECT.noProposalTitle), line: t(PROJECT.noProposalLine) },
    crew: { title: t(PROJECT.crewTitle), line: t(PROJECT.crewLine) },
    /** The crew row: the message to send, or the facts it still needs, listed in the reader's way. */
    crewRow: (missing: readonly CrewMessageFact[]) =>
      missing.length === 0
        ? { title: t(PROJECT.crewTitle), line: t(PROJECT.crewLine), ready: true }
        : {
            title: t(PROJECT.crewNeedsTitle),
            line: t(PROJECT.crewNeeds, {
              facts: listOf(
                t,
                missing.map((fact) => t(CREW_FACT[fact])),
              ),
            }),
            ready: false,
          },
    /** The version row: the one in force — saying when a newer one waits — or won without one. */
    versionRow: (
      inForce: { readonly number: string; readonly version: number } | null,
      newer: number | null,
    ) =>
      inForce === null
        ? { title: t(PROJECT.noProposalTitle), line: t(PROJECT.noProposalLine), accepted: false }
        : {
            title: t(PROJECT.versionTitle, inForce),
            line:
              newer === null ? t(PROJECT.versionLine) : t(PROJECT.newerLine, { version: newer }),
            accepted: true,
          },
  };
}
