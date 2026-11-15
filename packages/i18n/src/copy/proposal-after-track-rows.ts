import type { ProposalDetail, ProposalTracking, TranslatedText } from '@heliogrid/contracts';
import { customerShortNameOf, LANGUAGES } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { leadTaskTitle } from './lead-detail-parts';

/** The track screen's acts, steps and rows in words (`SCR-M06-18`), beside its story's. */
type T = Translator['t'];

/**
 * What the caller holds for the tenant: how a moment reads on its clock — "Today, 18:02" — and how
 * long ago it was — "10 min ago", the hero's own sentences.
 */
export interface ProposalTrackFormats {
  readonly when: (instant: string) => string;
  readonly ago: (instant: string) => string;
}

export type TrackLine = { readonly title: TranslatedText; readonly line: TranslatedText };

/** Seconds in a minute: a read shorter than one is an open, not a read. */
export const WHOLE_MINUTE = 60;

/** Who the words name while the lead holds no name. */
export const THE_CUSTOMER = /*i18n*/ { id: 'the customer' };

const NOT_YET = /*i18n*/ { id: 'Not yet' };
const READ_FOR = /*i18n*/ { id: 'Read for {count} min' };

const ACT = {
  continue: /*i18n*/ { id: 'Continue the draft' },
  share: /*i18n*/ { id: 'Share with {name}' },
  sharePlain: /*i18n*/ { id: 'Share' },
  shareAgain: /*i18n*/ { id: 'Share again' },
  shareReady: /*i18n*/ { id: 'Share it' },
  call: /*i18n*/ { id: 'Call {name}' },
  callPlain: /*i18n*/ { id: 'Call the customer' },
  newVersion: /*i18n*/ { id: 'Make version {version}' },
  confirmWon: /*i18n*/ { id: 'Confirm won' },
  openProject: /*i18n*/ { id: 'Open the project' },
} as const;

const NODE = {
  generated: /*i18n*/ { id: 'Generated' },
  shared: /*i18n*/ { id: 'Shared' },
  opened: /*i18n*/ { id: 'Opened' },
  answered: /*i18n*/ { id: 'Answered' },
  declined: /*i18n*/ { id: 'Declined' },
  changeAsked: /*i18n*/ { id: 'Asked for a change' },
} as const;

const ROW = {
  noFollowUp: /*i18n*/ { id: 'No follow-up yet' },
  madeAtShare: /*i18n*/ { id: 'One is made when you share' },
  allClosed: /*i18n*/ { id: 'All proposal tasks are closed' },
  nothingOpen: /*i18n*/ { id: 'Nothing is open on this proposal' },
  taskDue: /*i18n*/ { id: '{who} · due {when}' },
  thank: /*i18n*/ { id: 'Thank {name} with a message' },
  thankPlain: /*i18n*/ { id: 'Thank the customer with a message' },
  written: /*i18n*/ { id: 'It is written for you' },
  crew: /*i18n*/ { id: 'The installation message is due' },
  crewLine: /*i18n*/ { id: 'Send {name} who is coming, when and for how long' },
  version: /*i18n*/ { id: 'Version {version} · current' },
  noVersion: /*i18n*/ { id: 'No version yet' },
  firstVersion: /*i18n*/ { id: 'A change makes version 2. This one stays as sent.' },
  olderKept: /*i18n*/ { id: 'Earlier versions are kept as they were sent' },
  madeAtGenerate: /*i18n*/ { id: 'Generate makes version 1' },
  links: /*i18n*/ { id: '{count, plural, one {# link} other {# links}} · {names}' },
  noLink: /*i18n*/ { id: 'No link yet' },
  linkAtShare: /*i18n*/ { id: 'The link is made when you share' },
  whoOpened: /*i18n*/ { id: 'See who opened which link' },
  document: /*i18n*/ { id: '{count, plural, one {# page} other {# pages}} · {language}' },
  openDocument: /*i18n*/ { id: 'Open the document' },
} as const;

export function trackNodeWords(t: T, formats: ProposalTrackFormats, tracking: ProposalTracking) {
  const at = (instant: string | null) =>
    instant === null ? t(NOT_YET) : shownAsSent(formats.when(instant));
  const seconds = tracking.viewedSeconds ?? 0;
  const answer =
    tracking.answer === 'decline'
      ? NODE.declined
      : tracking.answer === 'negotiate'
        ? NODE.changeAsked
        : NODE.answered;
  return [
    { name: t(NODE.generated), when: at(tracking.generatedAt) },
    { name: t(NODE.shared), when: at(tracking.sharedAt) },
    {
      name: t(NODE.opened),
      when:
        tracking.firstOpenedAt !== null && seconds >= WHOLE_MINUTE
          ? t(READ_FOR, { count: Math.round(seconds / WHOLE_MINUTE) })
          : at(tracking.firstOpenedAt),
    },
    { name: t(answer), when: at(tracking.answeredAt) },
  ];
}

export type TrackRowKind = 'follow_up' | 'thank' | 'crew' | 'version' | 'links' | 'document';

function followUpRow(t: T, formats: ProposalTrackFormats, detail: ProposalDetail): TrackLine {
  const task = detail.followUp;
  if (task !== null) {
    return {
      title: leadTaskTitle(t, task),
      line: t(ROW.taskDue, { who: task.assignee.name, when: formats.when(task.dueAt) }),
    };
  }
  const waitsForShare = detail.standing === 'ready' || detail.standing === 'draft';
  const line = waitsForShare
    ? ROW.madeAtShare
    : detail.standing === 'won'
      ? ROW.allClosed
      : ROW.nothingOpen;
  return { title: t(ROW.noFollowUp), line: t(line) };
}

/** The latest generated version: the document is the draft being worked, never a version. */
function latestVersionOf(detail: ProposalDetail): number | null {
  return detail.versions.reduce<number | null>(
    (latest, { version }) => (latest === null || version > latest ? version : latest),
    null,
  );
}

function versionRow(t: T, detail: ProposalDetail): TrackLine {
  const version = latestVersionOf(detail);
  if (version === null) return { title: t(ROW.noVersion), line: t(ROW.madeAtGenerate) };
  return {
    title: t(ROW.version, { version }),
    line: t(version > 1 ? ROW.olderKept : ROW.firstVersion),
  };
}

function linksRow(t: T, detail: ProposalDetail): TrackLine {
  if (detail.links.count === 0) return { title: t(ROW.noLink), line: t(ROW.linkAtShare) };
  return {
    title: t(ROW.links, { count: detail.links.count, names: detail.links.labels.join(', ') }),
    line: t(ROW.whoOpened),
  };
}

/** The document row counts the sheets the version shown prints — a long terms page is two. */
function documentRow(t: T, detail: ProposalDetail, sheets: number | null): TrackLine {
  const { language, pages } = detail.document;
  const endonym = Object.entries(LANGUAGES).find(([code]) => code === language)?.[1].endonym;
  return {
    title: t(ROW.document, { count: sheets ?? pages.length, language: endonym ?? language }),
    line: t(ROW.openDocument),
  };
}

/**
 * A row's two lines, chosen by what it is about and where the proposal stands. `sheets` is how
 * many sheets the version Track shows prints (`proposalSheetsOf`); unknown while it is read.
 */
export function trackRowWords(
  t: T,
  formats: ProposalTrackFormats,
  kind: TrackRowKind,
  detail: ProposalDetail,
  sheets: number | null = null,
): TrackLine {
  const name = customerShortNameOf(detail.document.deal.clientName, detail.document.deal.segment);
  switch (kind) {
    case 'follow_up':
      return followUpRow(t, formats, detail);
    case 'thank':
      return {
        title: name === null ? t(ROW.thankPlain) : t(ROW.thank, { name }),
        line: t(ROW.written),
      };
    case 'crew':
      return { title: t(ROW.crew), line: t(ROW.crewLine, { name: name ?? t(THE_CUSTOMER) }) };
    case 'version':
      return versionRow(t, detail);
    case 'links':
      return linksRow(t, detail);
    case 'document':
      return documentRow(t, detail, sheets);
  }
}

export type TrackActKind =
  | 'continue'
  | 'share'
  | 'share_again'
  | 'share_ready'
  | 'call'
  | 'new_version'
  | 'confirm_won'
  | 'open_project';

export function trackActWord(t: T, act: TrackActKind, detail: ProposalDetail): TranslatedText {
  const name = customerShortNameOf(detail.document.deal.clientName, detail.document.deal.segment);
  switch (act) {
    case 'continue':
      return t(ACT.continue);
    case 'share':
      return name === null ? t(ACT.sharePlain) : t(ACT.share, { name });
    case 'share_again':
      return t(ACT.shareAgain);
    case 'share_ready':
      return t(ACT.shareReady);
    case 'call':
      return name === null ? t(ACT.callPlain) : t(ACT.call, { name });
    case 'new_version':
      return t(ACT.newVersion, { version: (latestVersionOf(detail) ?? 0) + 1 });
    case 'confirm_won':
      return t(ACT.confirmWon);
    case 'open_project':
      return t(ACT.openProject);
  }
}
